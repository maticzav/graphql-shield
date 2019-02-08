import {
  IMiddleware,
  IMiddlewareFunction,
  IMiddlewareGeneratorConstructor,
} from 'graphql-middleware'
import {
  GraphQLSchema,
  GraphQLObjectType,
  isObjectType,
  isIntrospectionType,
  GraphQLResolveInfo,
} from 'graphql'
import { IRules, IOptions, ShieldRule, IRuleFieldMap } from './types'
import {
  isRuleFunction,
  isRuleFieldMap,
  isRule,
  isLogicRule,
  withDefault,
} from './utils'
import { ValidationError } from './validation'

/**
 *
 * @param options
 *
 * Generates a middleware function from a given rule and
 * initializes the cache object in context.
 *
 */
function generateFieldMiddlewareFromRule<TSource, TContext = any, TArgs>(
  rule: ShieldRule,
  options: IOptions,
): IMiddlewareFunction {
  async function middleware(
    resolve: (
      parent: TSource,
      args: TArgs,
      ctx: TContext,
      info: GraphQLResolveInfo,
    ) => any,
    parent: TSource,
    args: TArgs,
    ctx: TContext,
    info: GraphQLResolveInfo,
  ) {
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
      const res = await rule.resolve(parent, args, ctx, info, options)

      if (res === true) {
        return resolve(parent, args, ctx, info)
      } else if (res === false) {
        return options.fallbackError
      } else {
        return res
      }
    } catch (err) {
      if (options.debug) {
        throw err
      } else if (options.allowExternalErrors) {
        return err
      } else {
        return options.fallbackError
      }
    }
  }

  if (isRule(rule) && rule.extractFragment()) {
    return {
      fragment: rule.extractFragment(),
      resolve: middleware,
    }
  }

  if (isLogicRule(rule)) {
    return {
      fragments: rule.extractFragments(),
      resolve: middleware,
    }
  }

  return middleware
}

/**
 *
 * @param type
 * @param rules
 * @param options
 *
 * Generates middleware from rule for a particular type.
 *
 */
function applyRuleToType(
  type: GraphQLObjectType,
  rules: ShieldRule | IRuleFieldMap,
  options: IOptions,
): IMiddleware {
  if (isRuleFunction(rules)) {
    /* Apply defined rule function to every field */
    const fieldMap = type.getFields()

    const middleware = Object.keys(fieldMap).reduce((middleware, field) => {
      return {
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(rules, options),
      }
    }, {})

    return middleware
  } else if (isRuleFieldMap(rules)) {
    /* Apply rules assigned to each field to each field */
    const fieldMap = type.getFields()

    /* Validation */

    const fieldErrors = Object.keys(rules)
      .filter(type => !Object.prototype.hasOwnProperty.call(fieldMap, type))
      .map(field => `${type.name}.${field}`)
      .join(', ')

    if (fieldErrors.length > 0) {
      throw new ValidationError(
        `It seems like you have applied rules to ${fieldErrors} fields but Shield cannot find them in your schema.`,
      )
    }

    /* Generation */

    const middleware = Object.keys(fieldMap).reduce(
      (middleware, field) => ({
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(
          withDefault(options.fallbackRule)(rules[field]),
          options,
        ),
      }),
      {},
    )

    return middleware
  } else {
    /* Apply fallbackRule to type with no defined rule */
    const fieldMap = type.getFields()

    const middleware = Object.keys(fieldMap).reduce(
      (middleware, field) => ({
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(options.fallbackRule, options),
      }),
      {},
    )

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
  options: IOptions,
): IMiddleware {
  const typeMap = schema.getTypeMap()

  const middleware = Object.keys(typeMap)
    .filter(type => !isIntrospectionType(typeMap[type]))
    .reduce((middleware, typeName) => {
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
    /* Applies rule to entire schema. */
    return applyRuleToSchema(schema, rules, options)
  } else {
    /**
     * Checks type map and field map and applies rules
     * to particular fields.
     */
    const typeMap = schema.getTypeMap()

    /* Validation */

    const typeErrors = Object.keys(rules)
      .filter(type => !Object.prototype.hasOwnProperty.call(typeMap, type))
      .join(', ')

    if (typeErrors.length > 0) {
      throw new ValidationError(
        `It seems like you have applied rules to ${typeErrors} types but Shield cannot find them in your schema.`,
      )
    }

    // Generation

    const middleware = Object.keys(typeMap)
      .filter(type => !isIntrospectionType(typeMap[type]))
      .reduce<IMiddleware>((middleware, typeName) => {
        const type = typeMap[typeName]

        if (isObjectType(type)) {
          return {
            ...middleware,
            [typeName]: applyRuleToType(type, rules[typeName], options),
          }
        } else {
          return middleware
        }
      }, {})

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
export function generateMiddlewareGeneratorFromRuleTree<
  TSource = any,
  TContext = any,
  TArgs = any
>(
  ruleTree: IRules,
  options: IOptions,
): IMiddlewareGeneratorConstructor<TSource, TContext, TArgs> {
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
