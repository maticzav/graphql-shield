import * as tools from '@graphql-tools/utils'
import { GraphQLResolveInfo, GraphQLSchema, ValidationRule } from 'graphql'

import {} from './schema'
import { ShieldAuthorizationError } from './error'

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
 * Returns functions that you should bind to specific execution layers.
 */
export function shield<Context, Schema extends GlobalSchema = GlobalSchema>(
  schema: Schema,
  options: ShieldOptions,
): {
  validate: ValidationRule
  wrapper: (schema: GraphQLSchema) => GraphQLSchema
} {
  // Parse schema
  const validationRules = extractValidationRules(schema)
  const executionRules = extractExecutionRules(schema)

  // Generate validator function
  const validatorFn = getValidationFunction(validationRules)
  const wrappingFunctions = getWrappingFunctions(executionRules)

  return {
    validate: (ctx) => {
      return {
        Field(node) {},
      }
    },
    wrapper: (schema: GraphQLSchema): GraphQLSchema => {
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
    },
  }
}

// /**
//  * Converts Shield parameters into a validation rule.
//  */
//  function OperationScopeRule(): ExtendedValidationRule {
//   return (context, executionArgs) => {
//     const permissionContext = getContext(executionArgs.contextValue)

//     const handleField = (node: FieldNode, objectType: GraphQLObjectType) => {
//       const schemaCoordinate = `${objectType.name}.${node.name.value}`

//       if (
//         !permissionContext.allowAll &&
//         !permissionContext.wildcardTypes.has(objectType.name) &&
//         !permissionContext.schemaCoordinates.has(schemaCoordinate)
//       ) {
//         context.reportError(new GraphQLError(schemaCoordinate, [node]))
//       }
//     }

//     return {
//       Field(node) {
//         const type = context.getType()
//         if (type) {
//           const wrappedType = getWrappedType(type)

//           if (isIntrospectionType(wrappedType)) {
//             return false
//           }
//         }

//         const parentType = context.getParentType()
//         if (parentType) {
//           if (isIntrospectionType(parentType)) {
//             return false
//           }

//           if (isObjectType(parentType)) {
//             handleField(node, parentType)
//           } else if (isUnionType(parentType)) {
//             for (const objectType of parentType.getTypes()) {
//               handleField(node, objectType)
//             }
//           } else if (isInterfaceType(parentType)) {
//             for (const objectType of executionArgs.schema.getImplementations(
//               parentType,
//             ).objects) {
//               handleField(node, objectType)
//             }
//           }
//         }

//         return undefined
//       },
//     }
//   }
// }
