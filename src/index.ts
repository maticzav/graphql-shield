import { IResolvers, IResolver, IPermissions, IPermission, Options, IResolverOptions } from './types'

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

   Object.keys(resolvers).forEach(key => {
      if (isMergableResolver(resolvers[key])) {
         destination[key] = mergeResolversAndPermissions(resolvers[key], permissions[key], options)
      } else {
         destination[key] = resolvePermission(resolvers[key], permissions[key], options)
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

         if (ctx.cache && ctx.cache[permission.name]) {
            authorised = ctx.cache[permission.name]
         } else {
            authorised = await permission(parent, args, ctx, info)
         }

         const _ctx = { 
            ...ctx, 
            cache: { 
               ...ctx.cache, 
               [permission.name]: authorised 
            }
         }
         
         if (authorised) {
            return resolver(parent, args, _ctx, info)
         }
         throw new PermissionError()
      } catch (err) {
         if (options.debug) {
            console.log(err)
         }
         throw new PermissionError()
      }
   }
}

function isMergableResolver(obj: any): boolean {
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