const bcrypt = require('bcrypt')

const { generateToken, setCookie } = require('../../helpers/cookies')

async function login(parent, { data: { email, password } }, ctx, info) {
  const user = await ctx.prisma.user({ email }, info)
  if (!user) {
    throw new Error('Could not find a match for username and password')
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) {
    throw new Error('Could not find a match for username and password')
  }

  const token = generateToken({ userId: user.id })
  setCookie(ctx.response, token)

  return user
}

module.exports = {
  login,
}
