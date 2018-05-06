import { IMiddleware } from 'graphql-middleware'
import { IRuleFunction, IRuleOptions, IRules } from './types'
import { IMiddlewareFunction } from 'graphql-middleware/dist/types'

export { IRules }

// Helpers

function flattenObject<edge>(obj: object): edge[] {
  const values = Object.keys(obj).reduce((acc, key) => {
    if (typeof obj[key] === 'object') {
      return [...acc, ...flattenObject(obj[key])]
    } else {
      return [...acc, obj[key]]
    }
  }, [])
  return values
}

// Rule

class Rule {
  name: string = undefined
  cache: boolean = true
  _func: IRuleFunction

  constructor(func: IRuleFunction, options?: IRuleOptions) {
    this.name = func.name
    this.cache = options.cache
    this._func = func
  }

  async resolve(): Promise<boolean> {
    return false
  }
}

export const rule = (options: IRuleOptions) => (func: IRuleFunction): Rule => {
  return new Rule(func, options)
}

function extractRules(ruleMap: IRules): Rule[] {
  const resolvers = flattenObject<Rule | IRuleFunction>(ruleMap)
  const rules: Rule[] = resolvers.filter(<(x) => x is Rule>resolver => resolver instanceof Rule)

  return rules
}

// Cache

// Cache map

// Shield

function ruleToMiddleware(rule: IRuleFunction): IMiddlewareFunction {
  return async function(resolve, parent, args, ctx, info) {
    try {
      const allow = await rule(parent, args, ctx, info)

      if (allow) {
        return resolve(parent, args, ctx, info)
      } else {
        throw new Error()
      }
    } catch (err) {
      if (err instanceof CustomError || process.env.NODE_END !== 'production') {
        throw err
      } else {
        throw new Error('Not Authorised!')
      }
    }
  }
}

export function shield(rules: IRules): IMiddleware {
  const middleware = Object.keys(rules).reduce(
    (middleware, rule) => ({
      ...middleware,
      [rule]: false,
    }),
    {},
  )

  return middleware
}

// Error

export class CustomError extends Error {
  constructor(...props) {
    super(...props)
  }
}
