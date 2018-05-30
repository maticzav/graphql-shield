import { rule, and, or, not } from 'graphql-shield'
import { Context, getUserEmail } from '../utils'

export const isGrocer = rule()(async (parent, args, ctx: Context, info) => {
  const email = getUserEmail(ctx)
  return ctx.db.exists.Grocer({ email })
})

export const isCustomer = rule()(async (parent, args, ctx: Context, info) => {
  const email = getUserEmail(ctx)
  return ctx.db.exists.Customer({ email })
})

export const isAuthenticated = or(isCustomer, isGrocer)
