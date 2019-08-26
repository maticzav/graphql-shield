import { rule, and, or, not } from 'graphql-shield'
import { Context, getUserEmail } from '../utils'

// Uncomment the comments below to see the number of executions of each rule.
// Magic, right!

// To see the effect with no cache, set { cache: false } in isCustomer rule.

export const isGrocer = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    // console.log('SHIELD: IsGrocer?')

    const email = getUserEmail(ctx)
    return ctx.db.exists.Grocer({ email })
  },
)

export const isCustomer = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    // console.log('SHIELD: IsCustomer?')

    const email = getUserEmail(ctx)
    return ctx.db.exists.Customer({ email })
  },
)

export const isAuthenticated = or(isCustomer, isGrocer)
