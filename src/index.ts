import { IResolvers, IResolver, IResolverOptions, IResolverWithFragment, IResolverObject, IPermissions, IPermission, Options } from './types'
import chalk from 'chalk'

// Export

export const shield = (resolvers: IResolvers, permissions: IPermissions, options?: Options): IResolvers => {
   const development = process.env.NODE_ENV !== 'production'   

   // Override default options
   const _options = { 
      debug: false || development, 
      cache: true, 
      ...options 
   }

   return mergeResolversAndPermissions(resolvers, permissions, _options)
}

// Tree

function mergeResolversAndPermissions(
   resolvers: IResolvers | IResolverObject, 
   permissions: IPermissions, 
   options: Options
): IResolvers {
   let destination = {}

   // Create permission tree.
   getObjectsKeys(permissions, resolvers).forEach(key => {      
      const mergablePermissions = isMergableObject(permissions[key])
      const mergableResolvers = isMergableObject(resolvers[key])

      if (mergablePermissions && mergableResolvers) {
         destination[key] = mergeResolversAndPermissions(resolvers[key] as IResolverObject, permissions[key], options)
      } else if (mergablePermissions && !mergableResolvers) {
         destination[key] = mergeResolversAndPermissions({} as IResolverObject, permissions[key], options)
      } else if (!mergablePermissions && mergableResolvers) {
         destination[key] = generateResolversWithPermission(resolvers[key] as IResolverObject, permissions[key], options)
      } else {
         destination[key] = generateResolverWithPermission(key, resolvers[key] as IResolver | IResolverOptions | IResolverWithFragment, permissions[key], options)
      }
   }) 

   return destination
}

// Tree generation helpers

function generateResolversWithPermission(
   resolvers: IResolverObject, 
   permission: IPermission, 
   options: Options
): IResolvers {
   const permissions = map(permission, resolvers)
   return mergeResolversAndPermissions(resolvers, permissions, options)
}

function generateResolverWithPermission(
   key: string, 
   resolver: IResolver | IResolverOptions | IResolverWithFragment, 
   permission: IPermission, 
   options: Options
): IResolver | IResolverOptions | IResolverWithFragment {
   if (!resolver) {
      resolver = _identity(key)
   }

   if (!permission) {
      permission = _allowInDebugMode(options)
   }

   if (isResolverWithFragment(resolver)) {
      return resolveResolverWithFragmentPermission(key, resolver as IResolverWithFragment, permission, options)
   }
   if (isResolverWithOptions(resolver)) {
      return resolveResolverWithOptionsPermission(key, resolver as IResolverOptions, permission, options)
   }

   return resolveResolverPermission(key, resolver as IResolver, permission, options)
}

function resolveResolverWithFragmentPermission(
   key: string, 
   resolver: IResolverWithFragment, 
   permission: IPermission, 
   options: Options
): IResolverWithFragment {
   return {
      fragment: resolver.fragment,
      resolve: resolveResolverPermission(key, resolver.resolve, permission, options)
   }
}

function resolveResolverWithOptionsPermission(
   key: string, 
   resolver: IResolverOptions, 
   permission: IPermission, 
   options: Options
): IResolverOptions {
   return {
      resolve: resolver.resolve && resolveResolverPermission(key, resolver.resolve, permission, options),
      subscribe: resolver.subscribe && resolveResolverPermission(key, resolver.subscribe, permission, options),
      __isTypeOf: resolver.__isTypeOf,
      __resolveType: resolver.__resolveType
   }
}

function resolveResolverPermission(
   key: string, 
   resolver: IResolver, 
   permission: IPermission, 
   options: Options
): IResolver {
   return async (parent, args, ctx, info) => {      
      try {
         let authorised: boolean

         if (options.cache && ctx && ctx._cache && ctx._cache[permission.name]) {
            authorised = ctx._cache[permission.name]
         } else {
            authorised = await permission(parent, args, ctx, info)
         }
               
         if (options.cache && ctx && isPermissionCachable(key, permission)) {
            if (!ctx._cache) {
               ctx._cache = {}
            }
            ctx._cache[permission.name] = authorised
         }

         if (authorised) {
            return resolver(parent, args, ctx, info)
         }
         throw new PermissionError()
      } catch (err) {
         if (options.debug) {
            debug`
               ${err}
            `
         }
         
         throw new PermissionError()
      }
   }
}

// Resolvers and permissions helpers

function _identity(key): IResolver {
   return (parent, args, ctx, info) => {
      return parent[key]
   }
}

function _allowInDebugMode(options: Options): IPermission {
   return (parent, args, ctx, info) => {
      if (options.debug) {
         debug`
            This function would be permited in PRODUCITON. You are in debug mode. 
            (To test production functionality set "debug" option to false.)
         `
         return true
      }
      return false
   }
}

export function every(..._permissions: IPermission[]): IPermission {
   return (parent, args, ctx, info) => {
      try {
         const permissions = _permissions.map(permission => true)
         
         return permissions.every(p => p)
      } catch(err) {
         return false
      }
   }
}

export function some(...permissions: IPermission[]): IPermission {
   return (parent, args, ctx, info) => {
      return false
   }
}

export function map(permission: IPermission, resolvers: object): IPermissions {
   return getObjectsKeys(resolvers).reduce((acc, key) => {
      acc[key] = permission
      return acc
   }, {})
}

// Helpers

function getObjectsKeys(...objs: object[]): any[] {
   return unique(concat(...objs.map(Object.keys)))
}

function unique(arr: any[]): any[] {
   return [...Array.from(new Set(arr))]
}

function concat(...arr: any[][]): any[] {
   return [].concat(...arr)
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

function isPermissionCachable(key: string, func: any): boolean {
	return key !== func.name
}

function debug(strings: TemplateStringsArray, ...args: any[]): void {
   const parts = strings.reduce((acc, val, index) => {
      acc.push(val)

      if(args[index]) {
         acc.push(args[index])
      }

      return acc
   }, [])

   console.log(chalk.blue('DEBUG LOG:'))
   console.log(chalk.blue('~~~~~~~~~~'))

   console.log(parts.join(''))

   console.log(chalk.blue('~~~~~~~~~~'))
}

// Error type

export class PermissionError extends Error {
   constructor() {
      super(`Insufficient Permissions.`)
   }
}