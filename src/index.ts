import { IMiddleware } from 'graphql-middleware'
import { IRuleFunction, IRule, IRuleOptions, IRules, IOptions } from './types'
import { IMiddlewareFunction } from 'graphql-middleware/dist/types'

export { IRules }

// Classes

export class CustomError extends Error {
  constructor(...args) {
    super(...args)
  }
}

export class Rule {
  readonly name: string = undefined
  private cache: boolean = true
  private _func: IRuleFunction

  constructor(name: string, func: IRuleFunction, _options: IRuleOptions = {}) {
    const options = this.normalizeOptions(_options)

    this.name = name
    this.cache = options.cache
    this._func = func
  }

  normalizeOptions(options: IRuleOptions) {
    return {
      cache: options.cache !== undefined ? options.cache : true,
    }
  }

  async _resolve(parent, args, ctx, info) {
    return this._func(parent, args, ctx, info)
  }

  async _resolveWithCache(parent, args, ctx, info) {
    if (!ctx._shield.cache[this.name]) {
      ctx._shield.cache[this.name] = this._resolve(parent, args, ctx, info)
    }
    return ctx._shield.cache[this.name]
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    if (this.cache) {
      return this._resolveWithCache(parent, args, ctx, info)
    } else {
      return this._resolve(parent, args, ctx, info)
    }
  }

  equals(rule: Rule) {
    return this._func === rule._func
  }
}

export class LogicRule {
  private _rules: IRule[]

  constructor(rules: IRule[]) {
    this._rules = rules
  }

  getRules() {
    return this._rules
  }

  async evaluate(parent, args, ctx, info) {
    const rules = this.getRules()
    const tasks = rules.map(rule => rule.resolve(parent, args, ctx, info))

    return Promise.all(tasks)
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    return false
  }
}

// Extended Types

export class RuleOr extends LogicRule {
  constructor(funcs: IRule[]) {
    super(funcs)
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    const res = await this.evaluate(parent, args, ctx, info)
    return res.some(permission => permission)
  }
}

export class RuleAnd extends LogicRule {
  constructor(funcs: IRule[]) {
    super(funcs)
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    const res = await this.evaluate(parent, args, ctx, info)
    return res.every(permission => permission)
  }
}

export class RuleNot extends LogicRule {
  constructor(func: IRule) {
    super([func])
  }

  async resolve(parent, args, ctx, info): Promise<boolean> {
    const res = await this.evaluate(parent, args, ctx, info)
    return res.every(permission => !permission)
  }
}

// Type checks

function isRuleFunction(x: any): x is IRule {
  return x instanceof Rule || x instanceof LogicRule
}

// Wrappers

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

export const and = (...rules: IRule[]): RuleAnd => {
  return new RuleAnd(rules)
}

export const or = (...rules: IRule[]): RuleOr => {
  return new RuleOr(rules)
}

export const not = (rule: IRule): RuleNot => {
  return new RuleNot(rule)
}

// Predefined rules

export const allow: Rule = rule()(() => true)
export const deny: Rule = rule()(() => false)

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

// Validation

function validateRules(rules: Rule[]): boolean {
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

// Generators

const wrapResolverWithRule = (options: IOptions) => (
  rule: IRule,
): IMiddlewareFunction =>
  async function(resolve, parent, args, ctx, info) {
    // Cache
    if (!ctx) {
      ctx = {}
    }

    if (!ctx._shield) {
      ctx._shield = {}
    }

    if (!ctx._shield.cache) {
      ctx._shield.cache = {}
    }

    // Execution
    try {
      const allow = await rule.resolve(parent, args, ctx, info)

      // NOTE: Shield catches non-permission errors as well,
      //       to prevent unpredicted Errors from leaking
      //       to the client.
      if (allow) {
        return resolve(parent, args, ctx, info)
      } else {
        throw new CustomError('Not Authorised!')
      }
    } catch (err) {
      if (err instanceof CustomError || options.allowExternalErrors) {
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

function generateMiddleware(ruleTree: IRules, options: IOptions): IMiddleware {
  const middleware = convertRulesToMiddleware(
    ruleTree,
    wrapResolverWithRule(options),
  )

  return middleware
}

function normalizeOptions(options: IOptions): IOptions {
  return {
    allowExternalErrors: options.allowExternalErrors !== undefined ? options.allowExternalErrors : false,
  }
}

// Shield

export function shield(
  ruleTree: IRules = allow,
  _options: IOptions = {},
): IMiddleware {
  const rules = extractRules(ruleTree)
  const options = normalizeOptions(_options)

  validateRules(rules)

  return generateMiddleware(ruleTree, options)
}
