const { arg } = require('nexus')
const { prismaObjectType } = require('nexus-prisma')
const { login, signup } = require('../lib/resolvers/mutations')

const Mutation = prismaObjectType({
  name: 'Mutation',
  definition(t) {
    t.field('signup', {
      args: t.prismaType.createUser.args,
      resolve: signup,
      type: 'User',
    })
    t.field('login', {
      args: {
        data: arg({
          type: 'LoginInput',
        }),
      },
      resolve: login,
      type: 'User',
    })
  },
})

module.exports = {
  Mutation,
}
