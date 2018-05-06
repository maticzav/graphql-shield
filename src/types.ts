import {
  GraphQLFieldResolver,
  GraphQLScalarType,
  GraphQLTypeResolver,
  GraphQLResolveInfo,
} from 'graphql'

export type IRuleFunction = (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => Promise<boolean>

export interface IRuleOptions {
  cache?: boolean
}

export interface IRuleTypeMap {
  [key: string]: IRuleFunction | IRuleFieldMap
}

export interface IRuleFieldMap {
  [key: string]: IRuleFunction
}

export type IRules = IRuleFunction | IRuleTypeMap
