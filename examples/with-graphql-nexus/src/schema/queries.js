const { prismaObjectType } = require('nexus-prisma')

const { me } = require('../lib/resolvers/queries')

const Query = prismaObjectType({
  name: 'Query',
  definition(t) {
    t.prismaFields(['*'])
    t.field('me', {
      nullable: true,
      resolve: me,
      type: 'User',
    })
  },
})

module.exports = { Query }
