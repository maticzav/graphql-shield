import { IResolvers, IResolver, IPermissions, IPermissionResolver, IPermissionsObject } from './types'

export default (resolvers: IResolvers, permissions: IPermissionsObject): IResolvers => {
   return mergeResolversAndPermissions(resolvers, permissions)
}

function mergeResolversAndPermissions(resolvers: IResolvers, permissions: IPermissions | IPermissionsObject): IResolvers {
   let destination = {}

   if (permissions === undefined) {
      return resolvers
   }

   Object.keys(resolvers).forEach(key => {
      if(isMergableObject(resolvers[key])) {
         destination[key] = mergeResolversAndPermissions(resolvers[key], permissions[key] as IPermissionsObject)
      } else {         
         destination[key] = resolvePermission(resolvers[key], permissions[key] as IPermissionResolver)
      }
   })

   return destination
}

function resolvePermission(resolver: IResolver, permission: IPermissionResolver): IResolver {
   if (isPromise(permission)) {
      return resolvePromisePermission(resolver, permission)
   } 
   if (isFunction(permission)) {
      return resolveRegularPermission(resolver, permission)
   } 
   return resolver
}

function resolvePromisePermission(resolver: IResolver, permission: IPermissionResolver): IResolver {
   return async (parent, args, ctx, info): IResolver => {
      const authorised = await permission(parent, args, ctx, info)
      console.log('promise auth', authorised);
      
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

function isPromise(obj: any): boolean {
   console.log(!!obj, (typeof obj === 'object' || typeof obj === 'function'), obj.prototype.then);
   
   
   return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
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