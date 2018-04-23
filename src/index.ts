import { IMiddleware } from 'graphql-middleware'
import { IRuleFunction, IRules } from './types'
import { IMiddlewareFunction } from 'graphql-middleware/dist/types'

export { IRules }

// Rule decorator

let rules = new Map<string, IRuleFunction>()

export function rule(func: IRuleFunction): IRuleFunction {
  const name = func.name
  if (rules.has(name)) {
    throw new Error(
      `It seems like you are trying to override the existing ${name} rule!`,
    )
  } else {
    rules.set(rule.name, func)
  }
  return func
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
      if (err instanceof RuleError || process.env.NODE_END !== 'production') {
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

export class RuleError extends Error {
  constructor(...props) {
    super(...props)
  }
}
