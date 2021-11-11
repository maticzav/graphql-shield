import { GraphQLResolveInfo } from 'graphql'
import * as uuid from 'uuid'
import * as zod from 'zod'

import './types'
import { error, ShieldAuthorizationError } from './error'
import { Require } from './utils'

/*
This file contains everything related to rule creation and definition.
We reuse this definitions in schema to generate execution and validation
functions.
 */

export enum RuleKind {
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

// Unique Symbol that prevents any code outside of GraphQL Shield to be structurally
// equal to types that we create internally.
const Lock = Symbol('GraphQLShield')
type Lock = typeof Lock

export type Rule<Parent = any, Arguments = any, Context = any> =
  // User Defined rules
  | {
      /**
       * Execution rule lets users run certain script during execution.
       * It should be asynchronous even when it's synchronous as a sensible default
       * to prevent users from forgetting to await for responses.
       *
       * Its return value determines whether we should allow or deny the access.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.EXECUTION
      readonly uuid: string
      resolver: (
        parent: Parent,
        args: Arguments,
        ctx: Context,
        info: GraphQLResolveInfo,
      ) => Promise<boolean | ShieldAuthorizationError>
      fields: string[]
    }
  | {
      /**
       * Validation rule lets users run a synchronous function during validation phase
       * of the GraphQL query execution cycle.
       *
       * Its return value determines whether we should allow or deny the access.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.VALIDATION
      readonly uuid: string
      resolver: (ctx: Context) => boolean | ShieldAuthorizationError
    }
  // Algebra
  | {
      /**
       * Allow rule always allows access to the given field.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.ALLOW
    }
  | {
      /**
       * Allow rule always denies access to the given field.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.DENY
    }
  // Operators
  | {
      /**
       * Or rule allows access if at least one of the options
       * returned true.
       *
       * NOTE: an empty or is equal to deny.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.OR
      readonly uuid: string
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      /**
       * Race rule allows access if at least one of the options
       * returned true and runs all rules in parallel.
       *
       * NOTE: an empty race is equal to deny.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.RACE
      readonly uuid: string
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      /**
       * And rule allows access if all rules returned true and runs all
       * rules in parallel.
       *
       * NOTE: an empty and is equal to allow.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.AND
      readonly uuid: string
      rules: Rule<Parent, Arguments, Context>[]
    }
  | {
      /**
       * Chain rule allows access if all rules returned true.
       *
       * NOTE: an empty chain is equal to allow.
       */
      readonly __lock__: Lock
      readonly kind: RuleKind.CHAIN
      readonly uuid: string
      rules: Rule<Parent, Arguments, Context>[]
    }

/**
 * A rule that we execute during the execution of the query.
 */
//  fn: (parent: GeneratedSchema[T]['parent'], args: GeneratedSchema[T]
export function execution<
  T extends keyof GraphQLShield.GlobalFieldsSchema = any,
  Context = any,
  Field extends keyof GraphQLShield.GlobalFieldsSchema[T]['parent'] & string = any,
>(
  fn:
    | ((
        parent: GraphQLShield.GlobalFieldsSchema[T]['parent'],
        args: GraphQLShield.GlobalFieldsSchema[T]['args'],
        context: Context,
        info: GraphQLResolveInfo,
      ) => Promise<boolean | ShieldAuthorizationError>)
    | {
        rule: (
          parent: Require<GraphQLShield.GlobalFieldsSchema[T]['parent'], Field>,
          args: GraphQLShield.GlobalFieldsSchema[T]['args'],
          context: Context,
          info: GraphQLResolveInfo,
        ) => Promise<boolean | ShieldAuthorizationError>
        fields: Field[]
      },
): Rule<GraphQLShield.GlobalFieldsSchema[T]['parent'], GraphQLShield.GlobalFieldsSchema[T]['args'], Context> {
  if (typeof fn !== 'function') {
    return {
      __lock__: Lock,
      kind: RuleKind.EXECUTION,
      uuid: uuid.v4(),
      resolver: (parent, args, context, info) => fn.rule(parent as any, args, context, info),
      fields: fn.fields,
    }
  }

  return {
    __lock__: Lock,
    kind: RuleKind.EXECUTION,
    uuid: uuid.v4(),
    resolver: (parent, args, context, info) => fn(parent, args, context, info),
    fields: [],
  }
}

/**
 * Validates input information using a zod schema.
 */
export function input<T extends keyof GraphQLShield.GlobalFieldsSchema = any, Context = any>(
  schema: (context: Context) => zod.Schema<GraphQLShield.GlobalFieldsSchema[T]['args']>,
): Rule<
  zod.Schema<GraphQLShield.GlobalFieldsSchema[T]['parent']>,
  zod.Schema<GraphQLShield.GlobalFieldsSchema[T]['args']>,
  Context
> {
  return {
    __lock__: Lock,
    kind: RuleKind.EXECUTION,
    uuid: uuid.v4(),
    resolver: async (parent, args, context) => {
      const result = await schema(context).spa(args)
      if (result.success) {
        return true
      }
      return error(result.error.message)
    },
    fields: [],
  }
}

/**
 * A rule that we execute in the validation phase of a query
 * lifecycle (i.e. before we execute the query).
 */
export function validation<Context>(fn: (ctx: Context) => boolean): Rule<any, any, Context> {
  return {
    __lock__: Lock,
    kind: RuleKind.VALIDATION,
    uuid: uuid.v4(),
    resolver: (ctx: Context) => fn(ctx),
  }
}

/**
 * Executes all rules at once and rejects when one of them returns false or an error.
 */
export function and<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  // If one of the rules is always false, "and" can't be true.
  if (rules.some((rule) => rule.kind === RuleKind.DENY)) {
    return deny()
  }

  // Remove ands because they don't add to anything.
  const normalizedRules = rules.filter((rule) => rule.kind !== RuleKind.ALLOW)

  // If we don't have any rules "and" is true.
  if (normalizedRules.length === 0) {
    return allow()
  }

  return {
    __lock__: Lock,
    kind: RuleKind.AND,
    uuid: uuid.v4(),
    rules: normalizedRules,
  }
}

/**
 * Executes rules one by one and resolves when all of them pass.
 */
export function chain<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  // If one of the rules is always false, "chain" can't be true.
  if (rules.some((rule) => rule.kind === RuleKind.DENY)) {
    return deny()
  }

  // Remove ands because they don't add to anything.
  const normalizedRules = rules.filter((rule) => rule.kind !== RuleKind.ALLOW)

  // If we don't have any rules "chain" is true.
  if (normalizedRules.length === 0) {
    return allow()
  }

  return {
    __lock__: Lock,
    kind: RuleKind.CHAIN,
    uuid: uuid.v4(),
    rules: normalizedRules,
  }
}

/**
 * Executes rules one by one until one of them return true.
 */
export function or<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  // If one of the rules is always true, "or" can't be denied.
  if (rules.some((rule) => rule.kind === RuleKind.ALLOW)) {
    return allow()
  }

  // Remove ands because they don't add to anything.
  const normalizedRules = rules.filter((rule) => rule.kind !== RuleKind.DENY)

  // If we don't have any rules "or" is false.
  if (normalizedRules.length === 0) {
    return deny()
  }

  return {
    __lock__: Lock,
    kind: RuleKind.OR,
    uuid: uuid.v4(),
    rules: normalizedRules,
  }
}

/**
 * Executes all rules at once and resolves when the first one
 * returns true.
 */
export function race<Parent, Arguments, Context>(
  rules: Rule<Parent, Arguments, Context>[],
): Rule<Parent, Arguments, Context> {
  // If one of the rules is always true, "race" can't be denied.
  if (rules.some((rule) => rule.kind === RuleKind.ALLOW)) {
    return allow()
  }

  // Remove ands because they don't add to anything.
  const normalizedRules = rules.filter((rule) => rule.kind !== RuleKind.DENY)

  // If we don't have any rules "race" is false.
  if (normalizedRules.length === 0) {
    return deny()
  }

  return {
    __lock__: Lock,
    kind: RuleKind.RACE,
    uuid: uuid.v4(),
    rules: normalizedRules,
  }
}

/**
 * Always allows the execution.
 */
export function allow<Parent, Arguments, Context>(): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: RuleKind.ALLOW,
  }
}

/**
 * Allways denies the execution.
 */
export function deny<Parent, Arguments, Context>(): Rule<Parent, Arguments, Context> {
  return {
    __lock__: Lock,
    kind: RuleKind.DENY,
  }
}
