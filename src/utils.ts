import { ShieldRule, ILogicRule, IRuleFieldMap, IRule } from './types'
import { Rule, LogicRule } from './rules'

/**
 *
 * @param x
 *
 * Makes sure that a certain field is a rule.
 *
 */
export function isRule(x: any): x is IRule {
  return x instanceof Rule
}

/**
 *
 * @param x
 *
 * Makes sure that a certain field is a logic rule.
 *
 */
export function isLogicRule(x: any): x is ILogicRule {
  return x instanceof LogicRule
}

/**
 *
 * @param x
 *
 * Makes sure that a certain field is a rule or a logic rule.
 *
 */
export function isRuleFunction(x: any): x is ShieldRule {
  return isRule(x) || isLogicRule(x)
}

/**
 *
 * @param x
 *
 * Determines whether a certain field is rule field map or not.
 *
 */
export function isRuleFieldMap(x: any): x is IRuleFieldMap {
  return (
    typeof x === 'object' &&
    Object.values(x).every(rule => isRuleFunction(rule))
  )
}

/**
 *
 * @param obj
 * @param func
 *
 * Flattens object of particular type by checking if the leaf
 * evaluates to true from particular function.
 *
 */
export function flattenObjectOf<edge>(
  obj: object,
  func: (x: any) => boolean,
): edge[] {
  const values = Object.keys(obj).reduce((acc, key) => {
    if (func(obj[key])) {
      return [...acc, obj[key]]
    } else if (typeof obj[key] === 'object' && !func(obj[key])) {
      return [...acc, ...flattenObjectOf(obj[key], func)]
    } else {
      return acc
    }
  }, [])
  return values
}

/**
 *
 * Returns fallback is provided value is undefined
 *
 * @param fallback
 */
export function withDefault<T>(fallback: T): (value: T | undefined) => T {
  return value => {
    if (value === undefined) return fallback
    return value
  }
}
