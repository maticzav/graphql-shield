import { IMiddleware, IMiddlewareFunction } from 'graphql-middleware'
import { IRule, IRules, IOptions } from './types'
import { isRuleFunction } from './utils'
import { CustomError } from './customError'

/**
 *
 * @param options
 *
 * Generates a middleware function from a given rule and
 * initializes the cache object in context.
 *
 */
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

    try {
      const allow = await rule.resolve(parent, args, ctx, info)

      if (allow) {
        return resolve(parent, args, ctx, info)
      } else {
        throw new CustomError('Not Authorised!')
      }
    } catch (err) {
      if (
        err instanceof CustomError ||
        options.debug ||
        options.allowExternalErrors
      ) {
        throw err
      } else {
        throw new Error('Not Authorised!')
      }
    }
  }

/**
 *
 * @param rules
 * @param wrapper
 *
 * Converts rule tree to middleware.
 *
 */
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
      ...acc,
      [key]: convertRulesToMiddleware(rules[key], wrapper),
    }),
    {},
  )

  return middleware
}

/**
 *
 * @param ruleTree
 * @param options
 *
 * Generates middleware from given rules.
 *
 */
export function generateMiddlewareFromRuleTree(
  ruleTree: IRules,
  options: IOptions,
): IMiddleware {
  const middleware = convertRulesToMiddleware(
    ruleTree,
    wrapResolverWithRule(options),
  )

  return middleware
}
