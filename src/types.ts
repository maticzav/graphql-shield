import { GraphQLResolveInfo } from 'graphql'
import { IMiddlewareGenerator } from 'graphql-middleware'

// Rule

export type ShieldRule = Rule | LogicRule

export declare class Rule {
  readonly name: string

  constructor(options: IRuleOptions)

  equals(rule: Rule): boolean
  extractFragment(): Fragment
  resolve<TSource, TContext, TArgs>(
    parent: TSource,
    args: TArgs,
    ctx: TContext,
    info: GraphQLResolveInfo,
    options: IOptions,
  ): Promise<RuleResult>
}

export interface IRuleOptions {
  cache: Cache
  fragment: Fragment
}

export declare class LogicRule {
  constructor(rules: ShieldRule[])

  getRules(): ShieldRule[]
  extractFragments(): Fragment[]
  evaluate<TSource, TContext, TArgs>(
    parent: TSource,
    args: TArgs,
    ctx: TContext,
    info: GraphQLResolveInfo,
    options: IOptions,
  ): Promise<RuleResult[]>
  resolve<TSource, TContext, TArgs>(
    parent: TSource,
    args: TArgs,
    ctx: TContext,
    info: GraphQLResolveInfo,
    options: IOptions,
  ): Promise<RuleResult>
}

export type Fragment = string
export type Cache = 'strict' | 'contextual' | 'no_cache'
export type RuleResult = boolean | string | Error
export type RuleFunction = (
  parent?: any,
  args?: any,
  context?: any,
  info?: GraphQLResolveInfo,
) => RuleResult | Promise<RuleResult>

// Rule Constructor Options

export type ICacheContructorOptions =
  | 'strict'
  | 'contextual'
  | 'no_cache'
  | boolean

export interface IRuleConstructorOptions {
  cache?: ICacheContructorOptions
  fragment?: Fragment
}

// Rules Definition Tree

export interface RuleTypeMap {
  [key: string]: ShieldRule | RuleFieldMap
}

export interface RuleFieldMap {
  [key: string]: ShieldRule
}

export type Rules = ShieldRule | RuleTypeMap

// Generator Options

export interface IOptions {
  debug: boolean
  allowExternalErrors: boolean
  fallbackRule: ShieldRule
  fallbackError: Error
}

export interface IOptionsConstructor {
  debug?: boolean
  allowExternalErrors?: boolean
  fallbackRule?: ShieldRule
  fallbackError?: string | Error
}

export declare function shield<TSource = any, TContext = any, TArgs = any>(
  ruleTree: Rules,
  options: IOptions,
): IMiddlewareGenerator<TSource, TContext, TArgs>
