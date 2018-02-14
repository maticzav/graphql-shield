import { GraphQLFieldResolver, GraphQLScalarType, GraphQLIsTypeOfFn, GraphQLTypeResolver } from 'graphql'

export type IPermissions = IPermissionsObject | IPermission

export interface IPermissionsObject {
   [key: string]: IPermissions
}

export type IPermission = (
   parent: any, 
   args: any, 
   ctx: any,
   info: any, 
) => boolean | Promise<boolean>

export interface IResolvers {
   [key: string]: (() => any) | IResolverObject | GraphQLScalarType
}

export type IResolverObject = {
   [key: string]: IResolver | IResolverOptions,
}

export type IResolver = GraphQLFieldResolver<any, any>

export interface IResolverOptions {
   resolve?: IResolver
   subscribe?: IResolver
   __resolveType?: GraphQLTypeResolver<any, any>
   __isTypeOf?: GraphQLIsTypeOfFn<any, any>
}

export interface Options {
   debug: boolean
   cache: boolean
}