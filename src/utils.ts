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
  return (
    x instanceof Rule || (x && x.constructor && x.constructor.name === 'Rule')
  )
}

/**
 *
 * @param x
 *
 * Makes sure that a certain field is a logic rule.
 *
 */
export function isLogicRule(x: any): x is ILogicRule {
  return (
    x instanceof LogicRule ||
    (x &&
      x.constructor &&
      (x.constructor.name === 'RuleOr' ||
        x.constructor.name === 'RuleAnd' ||
        x.constructor.name === 'RuleChain' ||
        x.constructor.name === 'RuleRace' ||
        x.constructor.name === 'RuleNot' ||
        x.constructor.name === 'RuleTrue' ||
        x.constructor.name === 'RuleFalse'))
  )
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
    Object.values(x).every((rule) => isRuleFunction(rule))
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
export function flattenObjectOf<T>(
  obj: { [key: string]: any },
  f: (x: any) => boolean,
): T[] {
  const values = Object.keys(obj).reduce<T[]>((acc, key) => {
    const val = obj[key]
    if (f(val)) {
      return [...acc, val]
    } else if (typeof val === 'object' && !f(val)) {
      return [...acc, ...flattenObjectOf(val, f)]
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
  return (value) => {
    if (value === undefined) return fallback
    return value
  }
}
