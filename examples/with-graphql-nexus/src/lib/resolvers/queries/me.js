function me(parent, args, ctx, info) {
  const id = ctx.request.userId || ''
  return ctx.prisma.user({ id }, info)
}

module.exports = {
  me,
}
