import { getUserId, Context } from './utils'

export const isAuthenticated = (parent, args, ctx, info) => {
   try {
      const userId = getUserId(ctx)
      if (userId) {
         return true
      } else {
         return false
      }
   } catch (err) {
      return false
   }
}

export const isUserPost = async (parent, {id}, ctx: Context, info) => {
   try {
      const userId = getUserId(ctx)
      const exists = await ctx.db.exists.Post({
         id,
         author: {
            id: userId
         }
      })
      
      return exists
   } catch(err) {
      console.log(err);
      return false
   }
}