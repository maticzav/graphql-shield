import { GraphQLFieldResolver, GraphQLScalarType, GraphQLIsTypeOfFn, GraphQLTypeResolver, TSource, TArgs, TContext, GraphQLResolveInfo } from 'graphql'

export interface IPermissions {
   [key: string]: IPermissionObject
}

export interface IPermissionObject {
   [key: string]: (() => boolean) | IPermissionResolver
}

export type IPermissionResolver = (
   source: TSource, 
   args: TArgs, 
   context: TContext, 
   info: GraphQLResolveInfo, 
) => boolean

export interface IResolvers {
   [key: string]: (() => any) | IResolverObject | GraphQLScalarType
}

export type IResolverObject = {
   [key: string]: GraphQLFieldResolver<any, any> | IResolverOptions,
}

export interface IResolverOptions {
   resolve?: GraphQLFieldResolver<any, any>
   subscribe?: GraphQLFieldResolver<any, any>
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
//    TSource,
//    TContext,
//    TArgs = { [argument: string]: any },
//    > = (
//       source: TSource,
//       args: TArgs,
//       context: TContext,
//       info: GraphQLResolveInfo,
//    ) => mixed;