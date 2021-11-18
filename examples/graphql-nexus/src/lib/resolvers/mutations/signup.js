const bcrypt = require('bcrypt')

const { generateToken, setCookie } = require('../../helpers/cookies')

async function signup(parent, { data }, ctx, info) {
  const existing = await ctx.prisma.user({ email: data.email })
  if (existing) {
    throw new Error(`User with email "${data.email}" already exists`)
  }

  const password = await bcrypt.hash(data.password, 10)
  const user = await ctx.prisma.createUser({ ...data, password }, info)

  const token = generateToken({ userId: user.id })
  setCookie(ctx.response, token)

  return user
}

module.exports = {
  signup,
}
