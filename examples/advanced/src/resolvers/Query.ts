import { getUserEmail, Context } from '../utils'

export const Query = {
  viewer: () => ({}),
  products: async (parent, args, ctx: Context, info) => {
    return ctx.db.query.products({}, info)
  },
}
