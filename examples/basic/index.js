import { GraphQLServer } from 'graphql-yoga'
import { rule, shield, and, or, not } from 'graphql-shield'

const typeDefs = `
  type Query {
    frontPage: [Fruit!]!
    fruits: [Fruit!]!
    customers: [Customer!]!
  }

  type Mutation {
    addFruitToBasket: Boolean!
  }

  type Fruit {
    name: String!
    count: Int!
  }

  type Customer {
    id: ID!
    basket: [Fruit!]!
  }
`

const resolvers = {
  Query: {
    frontPage: () => [
      { name: 'orange', count: 10 },
      { name: 'apple', count: 1 },
    ],
    fruits: () => [
      { name: 'orange', count: 10 },
      { name: 'apple', count: 1 },
      { name: 'strawberries', count: 100 },
    ],
    customers: () => [
      { id: 1, basket: [{ name: 'orange', count: 1 }] },
      { id: 2, basket: [{ name: 'apple', count: 2 }] },
    ],
  },
  Mutation: {
    addFruitToBasket: () => true,
  },
}

// Auth

const users = {
  mathew: {
    id: 1,
    name: 'Mathew',
    role: 'admin',
  },
  george: {
    id: 2,
    name: 'George',
    role: 'editor',
  },
  johnny: {
    id: 3,
    name: 'Johnny',
    role: 'customer',
  },
}

function getUser(req) {
  const auth = req.get('Authorization')
  if (users[auth]) {
    return users[auth]
  } else {
    return null
  }
}

// Rules

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user !== null
  },
)

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user.role === 'admin'
  },
)

const isEditor = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user.role === 'editor'
  },
)

// Permissions

const permissions = shield({
  Query: {
    frontPage: not(isAuthenticated),
    fruits: and(isAuthenticated, or(isAdmin, isEditor)),
    customers: and(isAuthenticated, isAdmin),
  },
  Mutation: {
    addFruitToBasket: isAuthenticated,
  },
  Fruit: isAuthenticated,
  Customer: isAdmin,
})

const server = GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions],
  context: (req) => ({
    ...req,
    user: getUser(req),
  }),
})

server.start(() => console.log('Server is running on http://localhost:4000'))
