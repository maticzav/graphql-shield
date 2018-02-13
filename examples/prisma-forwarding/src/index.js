const { GraphQLServer } = require('graphql-yoga')
const { Prisma } = require('prisma-binding')
const resolvers = require('./resolvers')

const server = new GraphQLServer({
  typeDefs: 'src/schema.graphql',
  resolvers,
  context: req => ({
    ...req,
    db: new Prisma({
      typeDefs: 'src/generated/prisma.graphql',
      endpoint: 'http://localhost:4466/shield-resolver-forwarding-example/dev',
      secret: 'mysecret123',
      debug: true
    }),
  }),
})

server.start(() => console.log(`Server is running on http://localhost:4000`))

