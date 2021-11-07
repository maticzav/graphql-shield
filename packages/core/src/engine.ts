import { GraphQLResolveInfo } from 'graphql'
import * as zod from 'zod'

import { error, ShieldAuthorizationError } from './error'
import { ExhaustiveSwitchCheck } from './utils'

declare const RuleKind: unique symbol

enum Kind {
  // Basic Rules
  FUNCTION = 'FUNCTIOn',
  // Operators
  ALLOW = 'ALLOW',
  DENY = 'DENY',
  OR = 'OR',
  RACE = 'RACE',
  AND = 'AND',
  CHAIN = 'CHAIN',
}

type Algebra<Parameters = any, Result = any> =
  // User Defined rules
  | {
      readonly kind: Kind.FUNCTION
      resolver: (params: Parameters) => Result
    }
  // Algebra
  | { readonly kind: Kind.ALLOW }
  | { readonly kind: Kind.DENY }
  // Operators
  | {
      readonly kind: Kind.OR
      rules: Algebra<Parameters, Result>[]
    }
  | {
      readonly kind: Kind.RACE
      rules: Algebra<Parameters, Result>[]
    }
  | {
      readonly kind: Kind.AND
      rules: Algebra<Parameters, Result>[]
    }
  | {
      readonly kind: Kind.CHAIN
      rules: Algebra<Parameters, Result>[]
    }

/**
 * Executes the rules schema using given parameters.
 */
export async function execute<Params, Return>(
  rule: Algebra<Params, Return>,
  params: Params,
): Promise<Return> {
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
