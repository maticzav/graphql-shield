import { IResolvers, IResolver, IPermissions, IPermissionResolver, IPermissionsObject } from './types'

export const shield = (resolvers: IResolvers, permissions: IPermissions): IResolvers => {
   return mergeResolversAndPermissions(resolvers, permissions)
}

function mergeResolversAndPermissions(resolvers: IResolvers, permissions: IPermissions): IResolvers {
   let destination = {}

   if (permissions === undefined) {
      return resolvers
   }

   Object.keys(resolvers).forEach(key => {
      if(isMergableObject(resolvers[key])) {
         destination[key] = mergeResolversAndPermissions(resolvers[key], permissions[key])
      } else {         
         destination[key] = resolvePermission(resolvers[key], permissions[key])
      }
   })

   return destination
}

function resolvePermission(resolver: IResolver, permission: IPermissionResolver): IResolver {
   if (isFunction(permission)) {
      return resolvePromisePermission(resolver, permission)
   } 
   return resolver
}

function resolvePromisePermission(resolver: IResolver, permission: IPermissionResolver): IResolver {
   return async (parent, args, ctx, info): IResolver => {
      const authorised = await permission(parent, args, ctx, info)      
      if (authorised) {
         return resolver(parent, args, ctx, info)   
      }
      throw new PermissionError()
      
   }
}

function resolveRegularPermission(resolver: IResolver, permission: IPermissionResolver): IResolver {
   return (parent, args, ctx, info): IResolver => {
      const authorised = permission(parent, args, ctx, info)
      console.log('promise auth', authorised);

      if (authorised) {
         return resolver(parent, args, ctx, info)
      }
      throw new PermissionError()
   }
}

function isFunction(obj: any): boolean {
   return !!obj && typeof obj === 'function'
}

function isMergableObject(obj: any): boolean {
   const nonNullObject = typeof obj === 'object' && obj !== {}

   return nonNullObject
      && Object.prototype.toString.call(obj) !== '[object RegExp]'
      && Object.prototype.toString.call(obj) !== '[object Date]'
}

class PermissionError extends Error {
   constructor() {
      super(`You don't have Permission to do this.`)
   }
}