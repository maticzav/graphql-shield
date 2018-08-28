import { IRuleFunction, IRuleConstructorOptions, ShieldRule } from './types'
import { Rule, RuleAnd, RuleOr, RuleNot, RuleTrue, RuleFalse } from './rules'

/**
 *
 * @param name
 * @param options
 *
 * Wraps a function into a Rule class. This way we can identify rules
 * once we start generating middleware from our ruleTree.
 *
 * 1.
 * const auth = rule()(async (parent, args, ctx, info) => {
 *  return true
 * })
 *
 * 2.
 * const auth = rule('name')(async (parent, args, ctx, info) => {
 *  return true
 * })
 *
 * 3.
 * const auth = rule({
 *  name: 'name',
 *  fragment: 'string',
 *  cache: 'cache',
 * })(async (parent, args, ctx, info) => {
 *  return true
 * })
 *
 */
export const rule = (
  name?: string | IRuleConstructorOptions,
  options?: IRuleConstructorOptions,
) => (func: IRuleFunction): Rule => {
  if (typeof name === 'object') {
    options = name
    name = Math.random().toString()
  } else if (typeof name === 'string') {
    options = options || {}
  } else {
    name = Math.random().toString()
    options = {}
  }

  return new Rule(name, func, {
    fragment: options.fragment,
    cache: options.cache,
  })
}

/**
 *
 * @param rules
 *
 * Logical operator and serves as a wrapper for and operation.
 *
 */
export const and = (...rules: ShieldRule[]): RuleAnd => {
  return new RuleAnd(rules)
}

/**
 *
 * @param rules
 *
 * Logical operator or serves as a wrapper for or operation.
 *
 */
export const or = (...rules: ShieldRule[]): RuleOr => {
  return new RuleOr(rules)
}

/**
 *
 * @param rule
 *
 * Logical operator not serves as a wrapper for not operation.
 *
 */
export const not = (rule: ShieldRule): RuleNot => {
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
