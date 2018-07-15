import { GraphQLResolveInfo } from 'graphql'
import { IMiddlewareGenerator } from 'graphql-middleware'

// Rule

export type ShieldRule = IRule | ILogicRule

export declare class IRule {
  readonly name: string

  constructor(options: IRuleConstructorOptions)

  equals(rule: IRule): boolean
  extractFragment(): IFragment
  resolve(parent, args, ctx, info): Promise<IRuleResult>
}

export declare interface IRuleOptions {
  name: string
  func: IRuleFunction
  cache?: ICache
  fragment?: IFragment
}

export declare class ILogicRule {
  constructor(rules: IRule[])

  getRules(): IRule[]
  extractFragment(): IFragment
  evaluate(parent, args, ctx, info): Promise<IRuleResult[]>
  resolve(parent, args, ctx, info): Promise<IRuleResult>
}

export type IFragment = string
export type ICache = 'strict' | 'contextual' | 'no_cache'
export type IRuleResult = boolean | ICustomError
export type IRuleFunction = (
  parent?: any,
  args?: any,
  context?: any,
  info?: GraphQLResolveInfo,
) => IRuleResult | Promise<IRuleResult>

export declare class ICustomError implements Error {
  name: string
  message: string

  constructor(message: any)
}

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
