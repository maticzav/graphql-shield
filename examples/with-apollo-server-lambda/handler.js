const { ApolloServer, gql } = require('apollo-server-lambda')
const { applyMiddleware } = require('graphql-middleware')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { rule, shield } = require('graphql-shield')

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
  return ctx.user
})

// Construct a schema, using GraphQL schema language.
let typeDefs = gql`
  type Query {
    hello: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
}

const permissions = shield({
  Query: {
    hello: isAuthenticated,
  },
})

const schema = applyMiddleware(
  makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
  permissions,
)

const server = new ApolloServer({
  schema,
  cors: {
    origin: '*',
    methods: 'GET,HEAD,POST',
  },
})

exports.graphql = server.createHandler()
