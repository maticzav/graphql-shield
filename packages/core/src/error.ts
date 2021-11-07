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
export class ShieldAuthorizationError extends Error {}
