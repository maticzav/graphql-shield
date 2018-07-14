import { ShieldRule, IRules } from './types'
import { Rule, LogicRule } from './rules'

/**
 *
 * @param x
 *
 * Makes sure that a certain field is a rule.
 *
 */
export function isRuleFunction(x: any): x is ShieldRule {
  return x instanceof Rule || x instanceof LogicRule
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
function flattenObjectOf<edge>(
  obj: object,
  func: (x: any) => boolean = () => false,
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
export function validateRules(ruleTree: IRules): boolean {
  const rules = extractRules(ruleTree)

  const map = rules.reduce((_map, rule) => {
    if (!_map.has(rule.name)) {
      return _map.set(rule.name, rule)
    } else if (!_map.get(rule.name).equals(rule)) {
      throw new Error(
        `Rule "${rule.name}" seems to point to two different things.`,
      )
    } else {
      return _map
    }
  }, new Map<string, Rule>())

  return true
}
