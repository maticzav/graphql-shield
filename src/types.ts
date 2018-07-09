import {
  GraphQLFieldResolver,
  GraphQLScalarType,
  GraphQLTypeResolver,
  GraphQLResolveInfo,
} from 'graphql'
import { Rule, LogicRule } from './rules'

export interface FragmentReplacement {
  field: string
  fragment: string
}

export type IRuleFunction = (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type IRule = Rule | LogicRule

export type IFragment = string
export type ICache = 'strict' | 'contextual' | 'no_cache'

// Rule Options

export type ICacheOptions = 'strict' | 'contextual' | 'no_cache' | boolean

export interface IRuleOptions {
  cache?: ICacheOptions
  fragment?: IFragment
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
  blacklist?: boolean
}
