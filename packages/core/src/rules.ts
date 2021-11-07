import { GraphQLResolveInfo } from 'graphql'
import { ShieldAuthorizationError } from './error'

declare const RuleKind: unique symbol

enum Kind {
  // Basic Rules
  EXECUTION,
  VALIDATION,
  // Operators
  ALLOW,
  DENY,
  OR,
  RACE,
  AND,
  CHAIN,
}

type RuleExecutionResult =
  | boolean
  | ShieldAuthorizationError
  | Promise<boolean>
  | Promise<ShieldAuthorizationError>

type Rule<Parent = any, Arguments = any, Context = any> =
  // User Defined rules
  | {
      readonly [RuleKind]: Kind.EXECUTION
      resolver: (
        parent: Parent,
        args: Arguments,
        ctx: Context,
        info: GraphQLResolveInfo,
      ) => RuleExecutionResult
      fields: string[]
    }
  | {
      readonly [RuleKind]: Kind.VALIDATION
      resolver: (ctx: Context) => RuleExecutionResult
    }
  // Algebra
  | { readonly [RuleKind]: Kind.ALLOW }
  | { readonly [RuleKind]: Kind.DENY }
  // Operators
  | {
      readonly [RuleKind]: Kind.OR
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      readonly [RuleKind]: Kind.RACE
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      readonly [RuleKind]: Kind.AND
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      readonly [RuleKind]: Kind.CHAIN
      rules: Rule<Parent, Arguments, Context>[]
    }

/**
 * A rule that we execute during the execution of the query.
 */
export function execution<Parent, Arguments, Context>(
  fn: (parent: Parent, args: Arguments) => RuleExecutionResult,
): Rule<Parent, Arguments, Context> {
  return {
    [RuleKind]: Kind.EXECUTION,
    resolver: () => false,
    fields: [],
  }
}

/**
 * Validates input information
 */
export function input<Parent, Arguments, Context>(
  fn: (args: Arguments) => boolean,
): Rule<Parent, Arguments, Context> {
  return {
    [RuleKind]: Kind.EXECUTION,
    resolver: (parent, args) => fn(args),
    // TODO: extract fields from the validation schema
    fields: [],
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
    [RuleKind]: Kind.VALIDATION,
    resolver: (ctx) => {
      return false
    },
  }
}

/**
 * Executes all rules at once and rejects when one of them returns false or an error.
 */
export function and<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return { [RuleKind]: Kind.AND, rules }
}

/**
 * Executes rules one by one and resolves when all of them pass.
 */
export function chain<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return { [RuleKind]: Kind.CHAIN, rules }
}

/**
 * Executes rules one by one until one of them return true.
 */
export function or<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return { [RuleKind]: Kind.OR, rules }
}

/**
 * Executes all rules at once and resolves when the first one
 * returns true.
 */
export function race<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  return { [RuleKind]: Kind.RACE, rules }
}

/**
 * Always allows the execution.
 */
export function allow<Parent, Arguments, Context>(): Rule<
  Parent,
  Arguments,
  Context
> {
  return { [RuleKind]: Kind.ALLOW }
}

/**
 * Allways denies the execution.
 */
export function deny<Parent, Arguments, Context>(): Rule<
  Parent,
  Arguments,
  Context
> {
  return { [RuleKind]: Kind.DENY }
}
