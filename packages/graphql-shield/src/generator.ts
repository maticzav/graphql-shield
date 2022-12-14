import {
  GraphQLSchema,
  GraphQLObjectType,
  isObjectType,
  isIntrospectionType,
  GraphQLResolveInfo,
  GraphQLFieldResolver,
} from 'graphql'
import {
  IRules,
  IOptions,
  ShieldRule,
  IRuleFieldMap,
  IShieldContext,
  IMiddlewareWithOptions,
  IMiddlewareTypeMap,
  IMiddlewareFieldMap,
} from './types.js'
import { isRuleFunction, isRuleFieldMap, isRule, isLogicRule, withDefault } from './utils.js'
import { ValidationError } from './validation.js'

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
): IMiddlewareWithOptions<object, IShieldContext, object> {
  async function middleware(
    resolve: GraphQLFieldResolver<object, IShieldContext, object>,
    parent: { [key: string]: any },
    args: { [key: string]: any },
    ctx: IShieldContext,
    info: GraphQLResolveInfo,
  ) {
    // Cache
    if (!ctx) {
      ctx = {} as IShieldContext
    }

    if (!ctx._shield) {
      ctx._shield = {
        cache: {},
      }
    }

    // Execution
    try {
      const res = await rule.resolve(parent, args, ctx, info, options)
      if (res === true) {
        const result = await resolve(parent, args, ctx, info)
        if (result instanceof Error) {
          throw result
        }
        return result
      } else if (res === false) {
        if (typeof options.fallbackError === 'function') {
          return await options.fallbackError(null, parent, args, ctx, info)
        }
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
        if (typeof options.fallbackError === 'function') {
          return await options.fallbackError(err, parent, args, ctx, info)
        }
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

  return {
    resolve: middleware,
  }
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
function applyRuleToType(type: GraphQLObjectType, rules: ShieldRule | IRuleFieldMap, options: IOptions): IMiddlewareFieldMap {
  if (isRuleFunction(rules)) {
    /* Apply defined rule function to every field */
    const fieldMap = type.getFields()

    const middleware = Object.keys(fieldMap).reduce<IMiddlewareFieldMap>((middleware, field) => {
      return {
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(rules, options),
      }
    }, {})

    return middleware
  } else if (isRuleFieldMap(rules)) {
    /* Apply rules assigned to each field to each field */
    const fieldMap = type.getFields()

    /* Extract default type wildcard if any and remove it for validation */
    const { '*': defaultTypeRule, ...rulesWithoutWildcard } = rules
    /* Validation */

    const fieldErrors = Object.keys(rulesWithoutWildcard)
      .filter((type) => !Object.prototype.hasOwnProperty.call(fieldMap, type))
      .map((field) => `${type.name}.${field}`)
      .join(', ')

    if (fieldErrors.length > 0) {
      throw new ValidationError(
        `It seems like you have applied rules to ${fieldErrors} fields but Shield cannot find them in your schema.`,
      )
    }

    /* Generation */

    const middleware = Object.keys(fieldMap).reduce<IMiddlewareFieldMap>(
      (middleware, field) => ({
        ...middleware,
        [field]: generateFieldMiddlewareFromRule(withDefault(defaultTypeRule || options.fallbackRule)(rules[field]), options),
      }),
      {},
    )

    return middleware
  } else {
    /* Apply fallbackRule to type with no defined rule */
    const fieldMap = type.getFields()

    const middleware = Object.keys(fieldMap).reduce<IMiddlewareFieldMap>(
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
function applyRuleToSchema(schema: GraphQLSchema, rule: ShieldRule, options: IOptions): IMiddlewareTypeMap {
  const typeMap = schema.getTypeMap()

  const middleware = Object.keys(typeMap)
    .filter((type) => !isIntrospectionType(typeMap[type]))
    .reduce<IMiddlewareTypeMap>((middleware, typeName) => {
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
export function generateMiddlewareFromSchemaAndRuleTree(
  schema: GraphQLSchema,
  rules: IRules,
  options: IOptions,
): IMiddlewareTypeMap {
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
      .filter((type) => !Object.prototype.hasOwnProperty.call(typeMap, type))
      .join(', ')

    if (typeErrors.length > 0) {
      throw new ValidationError(
        `It seems like you have applied rules to ${typeErrors} types but Shield cannot find them in your schema.`,
      )
    }

    // Generation

    const middleware = Object.keys(typeMap)
      .filter((type) => !isIntrospectionType(typeMap[type]))
      .reduce<IMiddlewareTypeMap>((middleware, typeName) => {
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
