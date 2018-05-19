import { GraphQLServer } from 'graphql-yoga'
import { rule, shield } from 'graphql-shield'

// Schema

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
    secret: String!
  }
`

// Data

const posts = [
  {
    id: 1,
    title: 'GraphQL is awesome!',
    text: 'Try GraphQL and explore the future of apis.',
    secret: 'Shitty secret.',
  },
  {
    id: 2,
    title: 'I love strawberries!',
    text: 'I just wanted to say that I like strawberries.',
    secret: "Can't see that if not authenticated. You must be very special.",
  },
]

const users = [
  { id: 1, name: 'Matic' },
  { id: 2, name: 'Johannes' },
  { id: 3, name: 'Nilan' },
]

const getUser = id => {
  const user = users.filter(user => user.id === id)
  if (!user) {
    throw new Error(`No such user!`)
  }
  return user
}

// Resolvers

const resolvers = {
  Query: {
    viewer: () => ({}),
    posts: () => posts,
  },
  Viewer: {
    name: (parent, args, ctx, info) => {
      const user = getUser(ctx.id)
      return user.name
    },
  },
}

// Rules

const isAuthenticated = rule(`isAuthenicated`, { cache: true })(
  async (parent, args, ctx, info) => {
    return ctx.user !== null
  },
)

const isAdmin = rule(`isAdmin`)(async (parent, args, ctx, info) => {
  return ctx.user.role === 'ADMIN'
})

// Permissions

const permissions = shield({
  Query: allow,
  Viewer: isAuthenticated,
  Post: {
    secret: isAuthenticated,
  },
})

const server = GraphQLServer({
  schema,
  middlewares: [permissions],
  context: req => ({
    ...req,
  }),
})
