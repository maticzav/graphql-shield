import { GraphQLResolveInfo } from 'graphql'
import { IMiddlewareGenerator } from 'graphql-middleware'

// Rule

export type ShieldRule = IRule | ILogicRule

export declare class IRule {
  readonly name: string

  constructor(options: IRuleConstructorOptions)

  equals(rule: IRule): boolean
  extractFragment(): IFragment
  resolve(parent, args, ctx, info): Promise<boolean>
}

export declare interface IRuleOptions {
  name: string
  func: IRuleFunction
  cache?: ICache
  fragment?: IFragment
}

export declare class ILogicRule {
  constructor(rules: IRule[])

  evaluate(parent, args, ctx, info): Promise<boolean[]>
  resolve(parent, args, ctx, info): Promise<boolean>
  getRules(): IRule[]
}

export type IFragment = string
export type ICache = 'strict' | 'contextual' | 'no_cache'

export type IRuleFunction = (
  parent?: any,
  args?: any,
  context?: any,
  info?: GraphQLResolveInfo,
) => boolean | Promise<boolean>

// Rule Constructor Options

export declare interface IRuleConstructorOptions {
  name: string
  func: IRuleFunction
  cache?: ICacheContructorOptions
  fragment?: IFragment
}

export type ICacheContructorOptions =
  | 'strict'
  | 'contextual'
  | 'no_cache'
  | boolean

export interface IRuleConstructorOptions {
  cache?: ICacheContructorOptions
  fragment?: IFragment
}

// Rules Definition Tree

export interface IRuleTypeMap {
  [key: string]: ShieldRule | IRuleFieldMap
}

export interface IRuleFieldMap {
  [key: string]: ShieldRule
}

export type IRules = ShieldRule | IRuleTypeMap

// Generator Options

export interface IOptions {
  debug?: boolean
  allowExternalErrors?: boolean
  blacklist?: boolean
}

export declare function shield(
  ruleTree: IRules,
  options: IOptions,
): IMiddlewareGenerator
