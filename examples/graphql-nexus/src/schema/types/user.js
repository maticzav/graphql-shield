const { prismaObjectType } = require('nexus-prisma')

const User = prismaObjectType({
  name: 'User',
  definition(t) {
    t.prismaFields({ filter: ['password'] })
  },
})

module.exports = { User }
