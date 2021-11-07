import { GraphQLResolveInfo } from 'graphql'
import * as zod from 'zod'

import { error, ShieldAuthorizationError } from './error'
import { ExhaustiveSwitchCheck } from './utils'

// Unique Symbol that prevents any code outside of GraphQL Shield to be structurally
// equal to types that we create internally.
const Lock = Symbol('GraphQLShield')
type Lock = typeof Lock

enum Kind {
  // Basic Rules
  EXECUTION = 'EXECUTION',
  VALIDATION = 'VALIDATION',
  // Operators
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  OR = 'OR',
  RACE = 'RACE',
  AND = 'AND',
  CHAIN = 'CHAIN',
}

type RuleExecutionResult =
  | boolean
  | ShieldAuthorizationError
  | Promise<boolean | ShieldAuthorizationError>

export type Rule<Parent = any, Arguments = any, Context = any> =
  // User Defined rules
  | {
      readonly __lock__: Lock
      readonly kind: Kind.EXECUTION
      resolver: (
        parent: Parent,
        args: Arguments,
        ctx: Context,
        info: GraphQLResolveInfo,
      ) => RuleExecutionResult
      fields: string[]
    }
  | {
      readonly __lock__: Lock
      readonly kind: Kind.VALIDATION
      resolver: (ctx: Context) => RuleExecutionResult
    }
  // Algebra
  | {
      readonly __lock__: Lock
      readonly kind: Kind.ALLOW
    }
  | {
      readonly __lock__: Lock
      readonly kind: Kind.DENY
    }
  // Operators
  | {
      readonly __lock__: Lock
      readonly kind: Kind.OR
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      readonly __lock__: Lock
      readonly kind: Kind.RACE
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      readonly __lock__: Lock
      readonly kind: Kind.AND
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      readonly __lock__: Lock
      readonly kind: Kind.CHAIN
      rules: Rule<Parent, Arguments, Context>[]
    }

/**
 * A rule that we execute during the execution of the query.
 */
export function execution<Parent, Arguments, Context>(
  fn: (parent: Parent, args: Arguments) => RuleExecutionResult,
): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.EXECUTION,
    resolver: () => false,
    fields: [],
  }
}

/**
 * Validates input information using a zod schema.
 */
export function input<Parent, Arguments, Context>(opts: {
  schema: zod.Schema<Arguments>
  fields: (keyof Arguments & string)[]
}): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.EXECUTION,
    resolver: async (parent, args) => {
      const result = await opts.schema.spa(args)
      if (result.success) {
        return true
      }
      return error(result.error.message)
    },
    fields: opts.fields,
  }
}

/**
 * A rule that we execute in the validation phase of a query
 * lifecycle (i.e. before we execute the query).
 */
export function validation<Parent, Arguments, Context>(
  fn: (ctx: Context) => RuleExecutionResult,
): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.VALIDATION,
    resolver: (ctx: Context) => fn(ctx),
  }
}

/**
 * Executes all rules at once and rejects when one of them returns false or an error.
 */
export function and<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.AND,
    rules,
  }
}

/**
 * Executes rules one by one and resolves when all of them pass.
 */
export function chain<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.CHAIN,
    rules,
  }
}

/**
 * Executes rules one by one until one of them return true.
 */
export function or<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.OR,
    rules,
  }
}

/**
 * Executes all rules at once and resolves when the first one
 * returns true.
 */
export function race<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: Kind.RACE,
    rules,
  }
}

/**
 * Always allows the execution.
 */
export function allow<Parent, Arguments, Context>(): Rule<
  Parent,
  Arguments,
  Context
> {
  return {
    __lock__: Lock,
    kind: Kind.ALLOW,
  }
}

/**
 * Allways denies the execution.
 */
export function deny<Parent, Arguments, Context>(): Rule<
  Parent,
  Arguments,
  Context
> {
  return {
    __lock__: Lock,
    kind: Kind.DENY,
  }
}

/**
 * Executes the rules schema using given parameters.
 */
export async function execute<Parent, Arguments, Context>(
  rule: Rule<Parent, Arguments, Context>,
  parent: Parent,
  args: Arguments,
  ctx: Context,
  info: GraphQLResolveInfo,
): Promise<boolean | ShieldAuthorizationError> {
  switch (rule.kind) {
    case Kind.EXECUTION:
      return rule.resolver(parent, args, ctx, info)
    case Kind.VALIDATION:
      return rule.resolver(ctx)
    // Algebra
    case Kind.ALLOW:
      return true
    case Kind.DENY:
      return false
    // Operators
    case Kind.AND:
      return new Promise(async (resolve) => {
        let i = rule.rules.length
        let resolved = false
        for (const subrule of rule.rules) {
          const exec = await execute(subrule, parent, args, ctx, info)
          i--
          if (exec instanceof ShieldAuthorizationError || exec === false) {
            resolve(exec)
            resolved = true
          }
          if (i === 0 && !resolved) {
            resolve(true)
          }
        }
      })
    case Kind.OR:
      return new Promise(async (resolve) => {
        let i = rule.rules.length
        let resolved = false
        for (const subrule of rule.rules) {
          const exec = await execute(subrule, parent, args, ctx, info)
          i--
          if (exec === true) {
            resolve(exec)
            resolved = true
          }
          if (i === 0 && !resolved) {
            resolve(false)
          }
        }
      })
    case Kind.CHAIN:
      return new Promise(async (resolve) => {
        let i = rule.rules.length
        let resolved = false
        for (const subrule of rule.rules) {
          const exec = await execute(subrule, parent, args, ctx, info)
          i--
          if (exec === true) {
            resolve(exec)
            resolved = true
          }
          if (i === 0 && !resolved) {
            resolve(false)
          }
        }
      })
    case Kind.RACE:
      return new Promise(async (resolve) => {
        let i = rule.rules.length
        let resolved = false
        for (const subrule of rule.rules) {
          const exec = await execute(subrule, parent, args, ctx, info)
          i--
          if (exec === true) {
            resolve(exec)
            resolved = true
          }
          if (i === 0 && !resolved) {
            resolve(false)
          }
        }
      })
    default:
      throw new ExhaustiveSwitchCheck(rule)
  }
}
