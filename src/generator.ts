import {
  IMiddleware,
  IMiddlewareFunction,
  IMiddlewareGenerator,
} from 'graphql-middleware'
import { GraphQLSchema, GraphQLObjectType, isObjectType } from 'graphql'
import {
  IRules,
  IOptions,
  IRuleTypeMap,
  ShieldRule,
  IRuleFieldMap,
} from './types'
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
function generateFieldMiddlewareFromRule(
  rule: ShieldRule,
  options: IOptions,
): IMiddlewareFunction {
  async function middleware(resolve, parent, args, ctx, info) {
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
      let res

      if (isRuleFunction(rule)) {
        res = await rule.resolve(parent, args, ctx, info)
      } else {
        res = !options.whitelist
      }

      if (res instanceof CustomError) {
        return res
      } else if (res) {
        return resolve(parent, args, ctx, info)
      } else {
        return new Error('Not Authorised')
      }
    } catch (err) {
      if (options.debug || options.allowExternalErrors) {
        return err
      } else {
        return new Error('Not Authorised!')
      }
    }
  }

  if (isRuleFunction(rule) && rule.extractFragment()) {
    return middleware
    // return {
    //   fragment: rule.extractFragment(),
    //   resolve: middleware,
    // }
  } else {
    return middleware
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
  rules: ShieldRule | IRuleFieldMap,
  options: IOptions,
): IMiddleware {
  if (isRuleFunction(rules)) {
    const fieldMap = type.getFields()

    const middleware = Object.keys(fieldMap).reduce((middleware, field) => {
      return {
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(rules, options),
      }
    }, {})

    return middleware
  } else {
    const fieldMap = type.getFields()

    const middleware = Object.keys(fieldMap).reduce((middleware, field) => {
      return {
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(rules[field], options),
      }
    }, {})

    return middleware
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

  const middleware = Object.keys(typeMap).reduce((middleware, typeName) => {
    const type = typeMap[typeName]

    if (isObjectType(type)) {
      return {
        ...middleware,
        [typeName]: applyRuleToType(type, rule, options),
      }
    } else {
      return middleware
    }
  }, {})

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

    const middleware = Object.keys(typeMap)
      .filter(type => isObjectType(typeMap[type]))
      .reduce(
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
