import { IResolvers, IResolver, IPermissions, IPermission, Options, IResolverOptions } from './types'
import chalk from 'chalk'

export const shield = (resolvers: IResolvers, permissions: IPermissions, options?: Options): IResolvers => {
   const _options = { 
      debug: false, 
      cache: true, 
      ...options 
   }
   return mergeResolversAndPermissions(resolvers, permissions, _options)
}

function mergeResolversAndPermissions(resolvers: IResolver, permissions: IPermissions, options: Options): IResolvers {
   let destination = {}

   if (permissions === undefined) {
      return resolvers
   }

   // Create permission tree
   Object.keys(permissions).forEach(key => {
      if (isMergableObject(permissions[key]) && isMergableObject(resolvers[key])) {
         destination[key] = mergeResolversAndPermissions(resolvers[key], permissions[key], options)
      } else if (isMergableObject(permissions[key])) {
         destination[key] = mergeResolversAndPermissions({}, permissions[key], options)
      } else {
         destination[key] = resolvePermission(resolvers[key] || identity(key), permissions[key], options)
      }
   }) 

   // Copy unpermitted resolvers
   Object.keys(resolvers).forEach(key => {
      if (!destination[key]) {
         destination[key] = mergeResolversAndPermissions(resolvers[key], permissions[key], options)
      }
   })

   return destination
}

function resolvePermission(resolver: IResolver, permission: IPermission, options: Options): IResolver {
   if (isResolverWithFragment(resolver)) {
      return resolveResolverWithFragmentPermission(resolver, permission, options)
   }
   if (isResolverWithOptions(resolver)) {
      return resolveResolverWithOptionsPermission(resolver, permission, options)
   }
   return resolveResolverPermission(resolver, permission, options)
}

function resolveResolverWithFragmentPermission(resolver: IResolver, permission: IPermission, options: Options) {
   return {
      fragment: resolver.fragment,
      resolve: resolveResolverPermission(resolver.resolve, permission, options)
   }
}

function resolveResolverWithOptionsPermission(resolver: IResolverOptions, permission: IPermission, options: Options) {
   return {
      resolve: resolver.resolve && resolveResolverPermission(resolver.resolve, permission, options),
      subscribe: resolver.subscribe && resolveResolverPermission(resolver.subscribe, permission, options),
      __isTypeOf: resolver.__isTypeOf,
      __resolveType: resolver.__resolveType
   }
}

function resolveResolverPermission(resolver: IResolver, permission: IPermission, options: Options) {
   return async (parent, args, ctx, info) => {
      try {
         let authorised: boolean

         if (options.cache && ctx._cache && ctx._cache[permission.name]) {
            authorised = ctx._cache[permission.name]
         } else {
            authorised = await permission(parent, args, ctx, info)
         }

         const _ctx = { 
            ...ctx, 
            _cache: { 
               ...ctx._cache, 
               [permission.name]: authorised 
            }
         }
         
         if (authorised) {
            return resolver(parent, args, _ctx, info)
         }
         throw new PermissionError()
      } catch (err) {
         if (options.debug) {
            console.log(chalk.blue('DEBUG LOG:'))
            console.log(err)
            console.log(chalk.blue('~~~~~~~~~~'))
         }
         
         throw new PermissionError()
      }
   }
}

function identity(key) {
   return (parent, args, ctx, info) => {
      return parent[key]
   }
}

function isMergableObject(obj: any): boolean {
   const nonNullObject = typeof obj === 'object' && obj !== {}

   return nonNullObject
      && !isResolverWithFragment(obj)
      && !isResolverWithOptions(obj)
      && Object.prototype.toString.call(obj) !== '[object RegExp]'
      && Object.prototype.toString.call(obj) !== '[object Date]'
}

function isResolverWithFragment(type: any): boolean {
   return typeof type === 'object' && 'fragment' in type
}

function isResolverWithOptions(type: any): boolean {
   return typeof type === 'object' && ('resolve' in type || 'subscribe' in type || '__resolveType' in type || '__isTypeOf' in type)
}

class PermissionError extends Error {
   constructor() {
      super(`Insufficient Permissions.`)
   }
}