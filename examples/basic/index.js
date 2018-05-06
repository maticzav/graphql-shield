import { rule, shield, allow } from 'graphql-shield'

// Rules

@rule({cache: true})
async function isAuthenticated(parent, args, ctx, info) {
  return ctx.user !== null
}

@rule({cache: false})
async function isAdmin(parent, args, ctx, info) {
  return ctx.user.role === 'ADMIN'
}

const typeDefs = gql`
  type Query {
    viewer: Viewer
    posts: Posts!
  }

  type Viewer {
    name: String!
  }

  type Post {
    id: ID!
    title: String!
    text: String!
  }
`

// Permissions

const permissions = shield({
  Query: allow,
  Viewer: isAuthenticated
})

const server = GraphQLYoga({
  schema,
  middlewares: [permissions]
})