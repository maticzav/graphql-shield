const { GraphQLServer } = require('graphql-yoga')
const shield = require('graphql-shield')

const typeDefs = `
  type Query {
    hello(name: String): String!
    secret(agent: String!, code: String!): String
  }
`

const resolvers = {
   Query: {
      hello: (_, { name }) => `Hello ${name || 'World'}`,
      secret: (_, { agent }) => `Hello agent ${name}`,
   },
}

const permissions = {
   Query: {
      hello: () => true,
      secret: (_, { code }) => code === 'donttellanyone'
   }
}

const server = new GraphQLServer({
   typeDefs,
   resolvers: shield(resolvers, permissions)
})

server.start(() => console.log('Server is running on localhost:4000'))