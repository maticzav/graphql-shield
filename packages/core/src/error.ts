/*
This file is heavily inspired by Apollo Errors. You don't have to use Apollo Errors
to use GraphQL Shield, but it's easy to use it in favour of GraphQL Shield defaults.

https://github.com/apollographql/apollo-server/blob/main/packages/apollo-server-errors/src/index.ts
*/

/**
 * Creates an instance of an error that GraphQL Shield considers safe to
 * be shown to the user.
 */
export function error(message: string) {
  return new ShieldAuthorizationError(message)
}

/**
 * Let's you safely return error reports.
 */
export class ShieldAuthorizationError extends Error {
  constructor(message: string) {
    super(message)
  }
}

// export type ShieldOptions = {
//   /**
//    * Tells whether GraphQL Shield is running in a debug environment
//    * and should make errors more elaborate.
//    */
//   debug: boolean
//   /**
//    * Tells whether GraphQL Shield should let thrown errors pass through
//    * the checker and expose internal credentials.
//    */
//   allowExternalErrors: boolean
// }
