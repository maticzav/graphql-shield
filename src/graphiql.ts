import { GraphQLObjectType } from 'graphql'

export function isGraphiQLType(type: GraphQLObjectType) {
  const introspectionTypes = [
    '__Schema',
    '__Type',
    '__TypeKind',
    '__Field',
    '__Directive',
    '__DirectiveLocation',
    '__InputValue',
    '__EnumValue',
  ]

  return introspectionTypes.some(
    introspectionType => introspectionType === type.name,
  )
}
