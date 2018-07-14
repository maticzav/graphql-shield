import {
  IMiddleware,
  IMiddlewareFunction,
  IMiddlewareGenerator,
} from 'graphql-middleware'
import { GraphQLSchema, GraphQLObjectType } from 'graphql'
import { IRule, IRules, IOptions, IRuleTypeMap, ShieldRule } from './types'
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
const applyRuleToField = (options: IOptions) => (
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
 * @param type
 * @param rules
 * @param options
 *
 *
 *
 */
function applyRuleToType(
  type: GraphQLObjectType,
  rules: ShieldRule | IRuleTypeMap,
  options: IOptions,
): IMiddleware {
  if (isRuleFunction(rules)) {
    return applyRuleTo
  } else {
  }
}

/**
 *
 * @param schema
 * @param rule
 * @param options
 *
 * Applies the same rule over entire schema.
 *
 */
function applyRuleToSchema(
  schema: GraphQLSchema,
  rule: ShieldRule,
  options,
): IMiddleware {
  const typeMap = schema.getTypeMap()

  const middleware = Object.keys(typeMap).reduce(
    (middleware, type) => ({
      ...middleware,
      [type]: applyRuleToType(
        typeMap[type] as GraphQLObjectType,
        rule,
        options,
      ),
    }),
    {},
  )

  return middleware
}

/**
 *
 * @param rules
 * @param wrapper
 *
 * Converts rule tree to middleware.
 *
 */
function generateMiddlewareFromSchemaAndRuleTree(
  schema: GraphQLSchema,
  rules: IRules,
  options: IOptions,
): IMiddleware {
  if (isRuleFunction(rules)) {
    return applyRuleToSchema(schema, rules, options)
  } else {
    const typeMap = schema.getTypeMap()

    const middleware = Object.keys(typeMap).reduce(
      (middleware, type) => ({
        ...middleware,
        [type]: applyRuleToType(
          typeMap[type] as GraphQLObjectType,
          rules[type],
          options,
        ),
      }),
      {},
    )

    return middleware
  }
}

/**
 *
 * @param ruleTree
 * @param options
 *
 * Generates middleware from given rules.
 *
 */
export function generateMiddlewareGeneratorFromRuleTree(
  ruleTree: IRules,
  options: IOptions,
): IMiddlewareGenerator {
  const generator = (schema: GraphQLSchema) => {
    const middleware = generateMiddlewareFromSchemaAndRuleTree(
      schema,
      ruleTree,
      options,
    )

    return middleware
  }

  return generator
}
