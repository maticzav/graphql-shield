import { GraphQLFieldResolver, GraphQLSchema } from 'graphql'
import hash from 'object-hash'

import { composeResolvers, ResolversComposition } from '@graphql-tools/resolvers-composition'
import { addResolversToSchema } from '@graphql-tools/schema'
import { wrapSchema } from '@graphql-tools/wrap'

import {
  IOptions,
  IOptionsConstructor,
  ShieldRule,
  IHashFunction,
  IFallbackErrorType,
  IMiddlewareTypeMap,
  IMiddlewareWithOptions,
  IRules,
} from './types.js'
import { allow } from './constructors.js'
import { withDefault } from './utils.js'
import { getResolversFromSchema } from './getResolversFromSchema.js'
import { validateRuleTree, ValidationError } from './validation.js'
import { generateMiddlewareFromSchemaAndRuleTree } from './generator.js'
import { ReplaceFieldWithFragment } from './replaceFieldWithFragment.js'
import { FragmentReplacement, prepareFragmentReplacements } from './fragments.js'

/**
 *
 * @param options
 *
 * Makes sure all of defined rules are in accord with the options
 * shield can process.
 *
 */
export function normalizeOptions(options: IOptionsConstructor): IOptions {
  if (typeof options.fallbackError === 'string') {
    options.fallbackError = new Error(options.fallbackError)
  }

  return {
    debug: options.debug !== undefined ? options.debug : false,
    allowExternalErrors: withDefault(false)(options.allowExternalErrors),
    fallbackRule: withDefault<ShieldRule>(allow)(options.fallbackRule),
    fallbackError: withDefault<IFallbackErrorType>(new Error('Not Authorised!'))(options.fallbackError),
    hashFunction: withDefault<IHashFunction>(hash)(options.hashFunction),
    disableFragmentsAndPostExecRules: withDefault<boolean>(false)(options.disableFragmentsAndPostExecRules),
  }
}

function middlewareToCompositionResolver(middlewareWithOptions: IMiddlewareWithOptions): ResolversComposition {
  const { resolve } = middlewareWithOptions
  if (resolve) {
    return (next) => (root, args, context, info) => resolve(next, root, args, context, info)
  }
  return (next) => (root, args, context, info) => next(root, args, context, info)
}

export function getFragmentReplacements(middleware: IMiddlewareTypeMap): FragmentReplacement[] {
  const fragmentReplacements = Object.entries(middleware).reduce<FragmentReplacement[]>((result, [objectName, objectFields]) => {
    Object.entries(objectFields).forEach(([fieldName, middlewareFunction]) => {
      const { fragment, fragments } = middlewareFunction
      if (fragment) {
        result.push({
          field: fieldName,
          fragment,
        })
      }
      if (fragments) {
        for (const fragment of fragments) {
          result.push({
            field: fieldName,
            fragment: fragment,
          })
        }
      }
    })
    return result
  }, [])

  return prepareFragmentReplacements(fragmentReplacements)
}

function applyComposition(schema: GraphQLSchema, middleware: IMiddlewareTypeMap): GraphQLSchema {
  const compositionRules = Object.entries(middleware).reduce<
    Record<string, Array<ResolversComposition<GraphQLFieldResolver<any, any, any, unknown>>>>
  >((result, [objectName, objectFields]) => {
    Object.entries(objectFields).forEach(([fieldName, middlewareFunction]) => {
      const compositionResolver = middlewareToCompositionResolver(middlewareFunction)
      result[`${objectName}.${fieldName}`] = [compositionResolver]
    })
    return result
  }, {})

  const originalResolvers = getResolversFromSchema(schema, true, true)

  const resolvers = composeResolvers(originalResolvers, compositionRules)

  return addResolversToSchema({ schema, resolvers })
}

/**
 *
 * @param schema
 * @param ruleTree
 * @param options
 *
 * Validates rules and applies defined rule tree to the schema.
 *
 */
export function shield(schema: GraphQLSchema, ruleTree: IRules, options: IOptionsConstructor = {}): GraphQLSchema {
  const normalizedOptions = normalizeOptions(options)
  const ruleTreeValidity = validateRuleTree(ruleTree)

  if (ruleTreeValidity.status === 'ok') {
    const middleware = generateMiddlewareFromSchemaAndRuleTree(schema, ruleTree, normalizedOptions)
    if (normalizedOptions.disableFragmentsAndPostExecRules) {
      return applyComposition(schema, middleware)
    }

    const fragmentReplacements = getFragmentReplacements(middleware)

    const wrappedSchema = wrapSchema({
      schema,
      transforms: [new ReplaceFieldWithFragment(fragmentReplacements || [])],
    })
    return applyComposition(wrappedSchema, middleware)
  } else {
    throw new ValidationError(ruleTreeValidity.message)
  }
}
