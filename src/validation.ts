import { IRules, ShieldRule, ILogicRule, IRule } from './types'
import { isRuleFunction, flattenObjectOf, isLogicRule } from './utils'

/**
 *
 * @param ruleTree
 *
 * Validates the rule tree declaration by checking references of rule
 * functions. We deem rule tree valid if no two rules with the same name point
 * to different rules.
 *
 */
export function validateRuleTree(
  ruleTree: IRules,
): { status: 'ok' } | { status: 'err'; message: string } {
  const rules = extractRules(ruleTree)

  const valid = rules.reduce<{ map: Map<string, IRule>; duplicates: string[] }>(
    ({ map, duplicates }, rule) => {
      if (!map.has(rule.name)) {
        return { map: map.set(rule.name, rule), duplicates }
      } else if (
        !map.get(rule.name)!.equals(rule) &&
        !duplicates.includes(rule.name)
      ) {
        return {
          map: map.set(rule.name, rule),
          duplicates: [...duplicates, rule.name],
        }
      } else {
        return { map, duplicates }
      }
    },
    { map: new Map<string, IRule>(), duplicates: [] },
  )

  if (valid.duplicates.length === 0) {
    return { status: 'ok' }
  } else {
    const duplicates = valid.duplicates.join(', ')
    return {
      status: 'err',
      message: `There seem to be multiple definitions of these rules: ${duplicates}`,
    }
  }

  /* Helper functions */
  /**
   *
   * @param ruleTree
   *
   * Extracts rules from rule tree.
   *
   */
  function extractRules(ruleTree: IRules): IRule[] {
    const resolvers = flattenObjectOf<ShieldRule>(ruleTree, isRuleFunction)

    const rules = resolvers.reduce<IRule[]>((rules, rule) => {
      if (isLogicRule(rule)) {
        return [...rules, ...extractLogicRules(rule)]
      } else {
        return [...rules, rule]
      }
    }, [])

    return rules
  }

  /**
   *
   * Recursively extracts Rules from LogicRule
   *
   * @param rule
   */
  function extractLogicRules(rule: ILogicRule): IRule[] {
    return rule.getRules().reduce<IRule[]>((acc, shieldRule) => {
      if (isLogicRule(shieldRule)) {
        return [...acc, ...extractLogicRules(shieldRule)]
      } else {
        return [...acc, shieldRule]
      }
    }, [])
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
  }
}
