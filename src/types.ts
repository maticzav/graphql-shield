import {
  GraphQLFieldResolver,
  GraphQLScalarType,
  GraphQLTypeResolver,
  GraphQLResolveInfo,
} from 'graphql'
import { Rule, LogicRule } from './'

export type IRuleFunction = (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => Promise<boolean>

export type IRule = Rule | LogicRule

export interface IRuleOptions {
  cache?: boolean
}

export interface IRuleTypeMap {
  [key: string]: IRule | IRuleFieldMap
}

export interface IRuleFieldMap {
  [key: string]: IRule
}

export type IRules = IRule | IRuleTypeMap

export interface IOptions {
  debug?: boolean
}
