import { getUserEmail, Context } from '../utils'

export const Viewer = {
  email: async (parent, args, ctx: Context, info) => {
    return getUserEmail(ctx)
  },
  basket: async (parent, args, ctx: Context, info) => {
    const email = getUserEmail(ctx)
    return ctx.db.query.basketItems(
      {
        where: {
          customer: { email },
        },
      },
      info,
    )
  },
}
