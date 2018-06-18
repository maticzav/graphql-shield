import {
  GraphQLFieldResolver,
  GraphQLScalarType,
  GraphQLTypeResolver,
  GraphQLResolveInfo,
} from 'graphql'
import { Rule, LogicRule } from './'

// Rules

export type IRuleFunction = (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type IRule = Rule | LogicRule

export type ICache = 'strict' | 'contextual' | 'no_cache'

// Rule Options

export type ICacheOptions = 'strict' | 'contextual' | 'no_cache' | boolean

export interface IRuleOptions {
  cache?: ICacheOptions
}

// RuleMap

export interface IRuleTypeMap {
  [key: string]: IRule | IRuleFieldMap
}

export interface IRuleFieldMap {
  [key: string]: IRule
}

export type IRules = IRule | IRuleTypeMap

// Options

export interface IOptions {
  debug?: boolean
  allowExternalErrors?: boolean
}
