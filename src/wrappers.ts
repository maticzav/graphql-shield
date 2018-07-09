import { IRuleFunction, IRuleOptions, IRule } from './types'
import { Rule, RuleAnd, RuleOr, RuleNot, RuleTrue, RuleFalse } from './rules'

/**
 *
 * @param name
 * @param options
 *
 * Wraps a function into a Rule class. This way we can identify rules
 * once we start generating middleware from our ruleTree.
 *
 */
export const rule = (name?: string | IRuleOptions, options?: IRuleOptions) => (
  func: IRuleFunction,
): Rule => {
  if (typeof name === 'string') {
    return new Rule(name, func, options)
  } else {
    const _name = Math.random().toString()
    return new Rule(_name, func, name)
  }
}

/**
 *
 * @param rules
 *
 * Logical operator and serves as a wrapper for and operation.
 *
 */
export const and = (...rules: IRule[]): RuleAnd => {
  return new RuleAnd(rules)
}

/**
 *
 * @param rules
 *
 * Logical operator or serves as a wrapper for or operation.
 *
 */
export const or = (...rules: IRule[]): RuleOr => {
  return new RuleOr(rules)
}

/**
 *
 * @param rule
 *
 * Logical operator not serves as a wrapper for not operation.
 *
 */
export const not = (rule: IRule): RuleNot => {
  return new RuleNot(rule)
}

/**
 *
 * Allow queries.
 *
 */
export const allow = new RuleTrue()

/**
 *
 * Deny queries.
 *
 */
export const deny = new RuleFalse()
