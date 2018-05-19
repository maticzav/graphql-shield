import { IMiddleware } from 'graphql-middleware'
import { IRuleFunction, IRule, IRuleOptions, IRules, IOptions } from './types'
import { IMiddlewareFunction } from 'graphql-middleware/dist/types'

export { IRules }

// Classes

export class CustomError extends Error {
  constructor(...props) {
    super(...props)
  }
}

export class Rule {
  name: string = undefined
  cache: boolean = true
  _func: IRuleFunction

  constructor(name: string, func: IRuleFunction, options?: IRuleOptions) {
    this.name = name
    this.cache = options.cache
    this._func = func
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    if (!ctx._shield.cache[this.name]) {
      ctx._shield.cache[this.name] = this._func(parent, args, ctx, info)
    }
    return ctx._shield.cache[this.name]
  }
}

export class LogicRule {
  _rules: IRule[]

  constructor(rules: IRule[]) {
    this._rules = rules
  }

  getRules() {
    return this._rules
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    return false
  }
}

// Extended Types

class RuleOr extends LogicRule {
  _rules: IRule[]

  constructor(funcs: IRule[]) {
    super(funcs)
  }

  async resolve(): Promise<boolean> {
    return false
  }
}

class RuleAnd extends LogicRule {
  _rules: IRule[]

  constructor(funcs: IRule[]) {
    super(funcs)
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    return false
  }
}

// Type checks

function isRuleFunction(x: any): x is IRule {
  return x instanceof Rule || x instanceof LogicRule
}

// Wrappers

export const rule = (name: string, options: IRuleOptions) => (
  func: IRuleFunction,
): Rule => {
  return new Rule(name, func, options)
}

export const and = (...rules: IRule[]): RuleAnd => {
  return new RuleAnd(rules)
}

export const or = (...rules: IRule[]): RuleOr => {
  return new RuleOr(rules)
}

// Helpers

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

function extractRules(ruleTree: IRules): Rule[] {
  const resolvers = flattenObjectOf<IRule>(ruleTree, isRuleFunction)
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

// Cache

function generateCache(rules: Rule[]) {
  const cache = rules.reduce(
    (_cache, rule) => ({
      ..._cache,
      [rule.name]: rule.resolve,
    }),
    {},
  )

  return cache
}

// Generators

const wrapResolverWithRule = (rules: Rule[], options: IOptions) => (
  rule: IRule,
): IMiddlewareFunction =>
  async function(resolve, parent, args, ctx, info) {
    if (!ctx._shield.cache) {
      ctx._shield.cache = {}
    }

    try {
      const allow = await rule.resolve(parent, args, ctx, info)

      if (allow) {
        return resolve(parent, args, ctx, info)
      } else {
        throw new Error()
      }
    } catch (err) {
      if (err instanceof CustomError || options.debug) {
        throw err
      } else {
        throw new Error('Not Authorised!')
      }
    }
  }

function convertRulesToMiddleware(
  rules: IRules,
  wrapper: (func: IRule) => IMiddlewareFunction,
): IMiddleware {
  if (isRuleFunction(rules)) {
    return wrapper(rules)
  }

  const leafs = Object.keys(rules)
  const middleware = leafs.reduce(
    (acc, key) => ({
      ...acc,
      [key]: convertRulesToMiddleware(rules[key], wrapper),
    }),
    {},
  )

  return middleware
}

function generateMiddleware(
  ruleTree: IRules,
  rules: Rule[],
  options: IOptions,
): IMiddleware {
  const middleware = convertRulesToMiddleware(
    ruleTree,
    wrapResolverWithRule(rules, options),
  )

  return middleware as IMiddleware
}

// Shield

export function shield(ruleTree: IRules, options?: IOptions): IMiddleware {
  const rules = extractRules(ruleTree)

  const optionsWithDefault = {
    debug: false,
    ...options,
  }

  return generateMiddleware(ruleTree, rules, optionsWithDefault)
}
