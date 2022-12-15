// copied from https://github.com/ardatan/graphql-tools/blob/7eacb50bc54a2023e2caecb6c7d25c705b756d49/packages/utils/src/getResolversFromSchema.ts
// TODO: merge the `includeDefaultFieldResolver` functionality into graphql-tools
import { IResolvers } from '@graphql-tools/utils'
import {
  GraphQLScalarType,
  GraphQLSchema,
  isScalarType,
  isEnumType,
  isInterfaceType,
  isUnionType,
  isObjectType,
  isSpecifiedScalarType,
  GraphQLFieldResolver,
  defaultFieldResolver,
} from 'graphql'

export function getResolversFromSchema(
  schema: GraphQLSchema,
  // Include default merged resolvers
  includeDefaultMergedResolver?: boolean,
  includeDefaultFieldResolver: boolean | GraphQLFieldResolver<any, any> = false,
): IResolvers {
  const resolvers = Object.create(null)

  const typeMap = schema.getTypeMap()

  for (const typeName in typeMap) {
    if (!typeName.startsWith('__')) {
      const type = typeMap[typeName]

      if (isScalarType(type)) {
        if (!isSpecifiedScalarType(type)) {
          const config = type.toConfig()
          delete config.astNode // avoid AST duplication elsewhere
          resolvers[typeName] = new GraphQLScalarType(config)
        }
      } else if (isEnumType(type)) {
        resolvers[typeName] = {}

        const values = type.getValues()
        for (const value of values) {
          resolvers[typeName][value.name] = value.value
        }
      } else if (isInterfaceType(type)) {
        if (type.resolveType != null) {
          resolvers[typeName] = {
            __resolveType: type.resolveType,
          }
        }
      } else if (isUnionType(type)) {
        if (type.resolveType != null) {
          resolvers[typeName] = {
            __resolveType: type.resolveType,
          }
        }
      } else if (isObjectType(type)) {
        resolvers[typeName] = {}

        if (type.isTypeOf != null) {
          resolvers[typeName].__isTypeOf = type.isTypeOf
        }

        const fields = type.getFields()
        for (const fieldName in fields) {
          const field = fields[fieldName]
          if (field.subscribe != null) {
            resolvers[typeName][fieldName] = resolvers[typeName][fieldName] || {}
            resolvers[typeName][fieldName].subscribe = field.subscribe
          }
          if (includeDefaultFieldResolver && (field.resolve == null || field.resolve?.name == 'defaultFieldResolver')) {
            resolvers[typeName][fieldName] = resolvers[typeName][fieldName] || {}
            resolvers[typeName][fieldName].resolve =
              includeDefaultFieldResolver === true ? defaultFieldResolver : includeDefaultFieldResolver
          }
          if (field.resolve != null && field.resolve?.name !== 'defaultFieldResolver') {
            switch (field.resolve?.name) {
              case 'defaultMergedResolver':
                if (!includeDefaultMergedResolver) {
                  continue
                }
                break
              case 'defaultFieldResolver':
                continue
            }
            resolvers[typeName][fieldName] = resolvers[typeName][fieldName] || {}
            resolvers[typeName][fieldName].resolve = field.resolve
          }
        }
      }
    }
  }

  return resolvers
}
