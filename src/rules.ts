import * as hash from 'object-hash'
import {
  IRuleFunction,
  IRule,
  IRuleOptions,
  ICache,
  IFragment,
  ICacheContructorOptions,
  IRuleConstructorOptions,
  ILogicRule,
  IRuleResult,
} from './types'
import { isCustomError } from './utils'
import { error } from './customError'

export class Rule implements IRule {
  readonly name: string

  private cache: ICache
  private fragment: IFragment
  private func: IRuleFunction

  constructor(name, func, constructorOptions: IRuleConstructorOptions) {
    const options = this.normalizeOptions(constructorOptions)

    this.name = name
    this.func = func
    this.cache = options.cache
    this.fragment = options.fragment
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * Resolves rule and writes to cache its result.
   *
   */
  async resolve(parent, args, ctx, info): Promise<boolean> {
    const cacheKey = this.generateCacheKey(parent, args, ctx, info)

    if (!ctx._shield.cache[cacheKey]) {
      ctx._shield.cache[cacheKey] = this.func(parent, args, ctx, info)
    }
    return ctx._shield.cache[cacheKey]
  }

  /**
   *
   * @param rule
   *
   * Compares a given rule with the current one
   * and checks whether their functions are equal.
   *
   */
  equals(rule: Rule): boolean {
    return this.func === rule.func
  }

  /**
   *
   * Extracts fragment from the rule.
   *
   */
  extractFragment(): IFragment {
    return this.fragment
  }

  /**
   *
   * @param options
   *
   * Sets default values for options.
   *
   */
  private normalizeOptions(options: IRuleConstructorOptions): IRuleOptions {
    return {
      cache:
        options.cache !== undefined
          ? this.normalizeCacheOption(options.cache)
          : 'contextual',
      fragment: options.fragment !== undefined ? options.fragment : undefined,
    }
  }

  /**
   *
   * @param cache
   *
   * This ensures backward capability of shield.
   *
   */
  private normalizeCacheOption(cache: ICacheContructorOptions): ICache {
    switch (cache) {
      case true: {
        return 'strict'
      }
      case false: {
        return 'no_cache'
      }
      default: {
        return cache
      }
    }
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * Generates cache key based on cache option.
   *
   */
  private generateCacheKey(parent, args, ctx, info): string {
    switch (this.cache) {
      case 'strict': {
        const _hash = hash({
          parent,
          args,
        })
        return `${this.name}-${_hash}`
      }
      case 'contextual': {
        return this.name
      }
      case 'no_cache': {
        return `${this.name}-${Math.random()}`
      }
    }
  }
}

export class LogicRule implements ILogicRule {
  private rules: IRule[]

  constructor(rules: IRule[]) {
    this.rules = rules
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * By default logic rule resolves to false.
   *
   */
  async resolve(parent, args, ctx, info): Promise<IRuleResult> {
    return false
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * Evaluates all the rules.
   *
   */
  async evaluate(parent, args, ctx, info): Promise<IRuleResult[]> {
    const rules = this.getRules()
    const tasks = rules.map(rule => rule.resolve(parent, args, ctx, info))

    return Promise.all(tasks)
  }

  /**
   *
   * Returns rules in a logic rule.
   *
   */
  getRules() {
    return this.rules
  }

  extractFragment(): IFragment {
    return ''
  }
}

// Extended Types

export class RuleOr extends LogicRule {
  constructor(rules: IRule[]) {
    super(rules)
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * Makes sure that at least one of them has evaluated to true.
   *
   */
  async resolve(parent, args, ctx, info): Promise<IRuleResult> {
    const result = await this.evaluate(parent, args, ctx, info)

    if (result.every(res => res === false || isCustomError(res))) {
      return error(result)
    } else {
      return true
    }
  }
}

export class RuleAnd extends LogicRule {
  constructor(funcs: IRule[]) {
    super(funcs)
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * Makes sure that all of them have resolved to true.
   *
   */
  async resolve(parent, args, ctx, info): Promise<IRuleResult> {
    const result = await this.evaluate(parent, args, ctx, info)

    if (result.some(res => res !== true)) {
      return error(result.filter(res => res !== true))
    } else {
      return true
    }
  }
}

export class RuleNot extends LogicRule {
  constructor(func: IRule) {
    super([func])
  }

  /**
   *
   * @param parent
   * @param args
   * @param ctx
   * @param info
   *
   * Negates the result.
   *
   */
  async resolve(parent, args, ctx, info): Promise<boolean> {
    const res = await this.evaluate(parent, args, ctx, info)
    return res.every(permission => !permission)
  }
}

export class RuleTrue extends LogicRule {
  constructor() {
    super([])
  }

  /**
   *
   * Always true.
   *
   */
  async resolve(): Promise<boolean> {
    return true
  }
}

export class RuleFalse extends LogicRule {
  constructor() {
    super([])
  }

  /**
   *
   * Always false.
   *
   */
  async resolve(): Promise<boolean> {
    return false
  }
}
