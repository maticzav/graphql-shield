import * as Yup from 'yup'
import { IRuleFunction, IRuleConstructorOptions, ShieldRule } from './types'
import {
  Rule,
  RuleAnd,
  RuleOr,
  RuleNot,
  RuleTrue,
  RuleFalse,
  InputRule,
  RuleChain,
  RuleRace,
} from './rules'

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
 * Constructs a new InputRule based on the schema.
 *
 * @param schema
 */
export const inputRule = <T>(name?: string) => (
  schema: (yup: typeof Yup) => Yup.Schema<T>,
  options?: Yup.ValidateOptions,
) => {
  if (typeof name === 'string') {
    return new InputRule(name, schema(Yup), options)
  } else {
    return new InputRule(Math.random().toString(), schema(Yup), options)
  }
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
 * Logical operator and serves as a wrapper for and operation.
 *
 */
export const chain = (...rules: ShieldRule[]): RuleChain => {
  return new RuleChain(rules)
}

/**
 *
 * @param rules
 *
 * Logical operator and serves as a wrapper for and operation.
 *
 */
export const race = (...rules: ShieldRule[]): RuleRace => {
  return new RuleRace(rules)
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
export const not = (rule: ShieldRule, error?: string | Error): RuleNot => {
  if (typeof error === 'string') return new RuleNot(rule, new Error(error))
  return new RuleNot(rule, error)
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
