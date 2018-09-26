import { ShieldRule, IRules, ILogicRule, IRuleFieldMap } from './types'
import { Rule, LogicRule } from './rules'
import { ValidationError } from './validation'

/**
 *
 * @param x
 *
 * Makes sure that a certain field is a rule.
 *
 */
export function isRule(x: any): x is Rule {
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
function flattenObjectOf<edge>(obj: object, func: (x: any) => boolean): edge[] {
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
 * @param ruleTree
 *
 * Extracts rules from rule tree.
 *
 */
export function extractRules(ruleTree: IRules): Rule[] {
  const resolvers = flattenObjectOf<ShieldRule>(ruleTree, isRuleFunction)
  const rules: Rule[] = resolvers.reduce((rules, rule) => {
    switch (rule.constructor) {
      case Rule: {
        return [...rules, rule]
      }
      case LogicRule: {
        return [...rules, (rule as LogicRule).getRules()]
      }
      default: {
        return rules
      }
    }
  }, [])
  return rules
}

/**
 *
 * @param ruleTree
 *
 * Validates the rule tree declaration by checking references of rule
 * functions. We deem rule tree valid if no two rules with the same name point
 * to different rules.
 *
 */
export function validateRules(ruleTree: IRules): IRules {
  const rules = extractRules(ruleTree)

  rules.reduce((_map, rule) => {
    if (!_map.has(rule.name)) {
      return _map.set(rule.name, rule)
    } else if (!_map.get(rule.name).equals(rule)) {
      throw new ValidationError(
        `Rule "${rule.name}" seems to point at two different things.`,
      )
    } else {
      return _map
    }
  }, new Map<string, Rule>())

  return ruleTree
}
