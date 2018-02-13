import { GraphQLFieldResolver, GraphQLScalarType, GraphQLIsTypeOfFn, GraphQLTypeResolver, GraphQLResolveInfo } from 'graphql'

export type IPermissions = IPermissionsObject | IPermissionResolver

export interface IPermissionsObject {
   [key: string]: IPermissions,
}

export type IPermissionResolver = (
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

// resolvers = {
//    Query: {
//       field1: () => res
//    },
//    Type: {
//       fi: () => res
//    }
// }

// export type GraphQLFieldResolver<
//    any,
//    TContext,
//    TArgs = { [argument: string]: any },
//    > = (
//       source: any,
//       args: TArgs,
//       context: TContext,
//       info: GraphQLResolveInfo,
//    ) => mixed;