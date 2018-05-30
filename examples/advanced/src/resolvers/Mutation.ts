import { Context, getUserEmail } from '../utils'

export const Mutation = {
  addItemToBasket: async (
    parent,
    { productId, quantity },
    ctx: Context,
    info,
  ) => {
    const email = getUserEmail(ctx)
    const item = await ctx.db.mutation.createBasketItem({
      data: {
        product: { connect: { id: productId } },
        quantity,
        customer: { connect: { email } },
      },
    })

    // Return empty object because we want to obtain Viewer.
    return {}
  },
  removeItemFromBasket: async (parent, { itemId }, ctx: Context, info) => {
    const item = await ctx.db.mutation.deleteBasketItem({
      where: { id: itemId },
    })

    // Return empty object because we want to obtain Viewer.
    return {}
  },
  addProduct: async (
    parent,
    { name, description, price },
    ctx: Context,
    info,
  ) => {
    return ctx.db.mutation.createProduct(
      { data: { name, description, price } },
      info,
    )
  },
  removeProduct: async (parent, { id }, ctx: Context, info) => {
    return ctx.db.mutation.deleteProduct({ where: { id } }, info)
  },
}
