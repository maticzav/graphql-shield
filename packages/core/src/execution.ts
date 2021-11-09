import * as tools from '@graphql-tools/utils'
import { GraphQLResolveInfo, GraphQLSchema, ValidationRule } from 'graphql'

import {} from './types'
import { ShieldAuthorizationError } from './error'

/*
This file contains code that we use to wrap resolvers with execution rules.
It heavily relies on `graphql-tools` and works similarly to how `graphql-middleware`
works. Relevant functions are wrapped in the rules that check if we may
actuall execute each of the requested resolvers.
 */

export type ShieldOptions = {
  /**
   * Tells whether GraphQL Shield is running in a debug environment
   * and should make errors more elaborate.
   */
  debug: boolean
  /**
   * Tells whether GraphQL Shield should let thrown errors pass through
   * the checker and expose internal credentials.
   */
  allowExternalErrors: boolean
  /**
   * Default error that Shield should use when the field
   * couldn't be accessed but the function hasn't returned a
   * ShieldAuthorizationError.
   */
  fallbackError?: ShieldAuthorizationError
}

/**
 * Returns a wrapping function that lets us run execution permissions.
 */
export function getResolversWrapper(): (schema: GraphQLSchema) => GraphQLSchema {
  return (schema: GraphQLSchema): GraphQLSchema => {
    return tools.mapSchema(schema, {
      [tools.MapperKind.FIELD]: (field, fieldName, typeName) => {
        // Ignore input types.
        if (!('resolve' in field)) {
          return field
        }

        // Compose resolver on regular fields.
        field.resolve = fieldCompositions[fieldName](field.resolve)

        return field
      },
    })
  }
}
