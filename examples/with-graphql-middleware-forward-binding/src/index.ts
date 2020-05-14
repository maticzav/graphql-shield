import { GraphQLServer } from 'graphql-yoga'
import { forward } from 'graphql-middleware-forward-binding'
import { shield, rule, or, and } from 'graphql-shield'
import { Prisma } from './generated/prisma'
import { Context } from './utils'
import { IMiddleware } from 'graphql-middleware'

// Forwarding

const forwardMiddleware = forward(
  'Query.post',
  'Query.posts',
  'Mutation.createPost',
  'Mutation.updatePost',
  'Mutation.deletePost',
)('db')

// Rules

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.db.exists.User({
      name: ctx.request.headers.authorization,
    })
  },
)

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.db.exists.User({
      name: ctx.request.headers.authorization,
      role: 'ADMIN',
    })
  },
)

const isEditor = rule({ cache: 'contextual' })(
  async (parent, args, ctx: Context, info) => {
    return ctx.db.exists.User({
      name: ctx.request.headers.authorization,
      role: 'EDITOR',
    })
  },
)

const isOwnerOfPost = rule({ cache: 'strict' })(
  async ({ id }, args, ctx: Context, info) => {
    return ctx.db.exists.Post({
      id,
      owner: {
        name: ctx.request.headers.authorization,
      },
    })
  },
)

// Permissions

const permissions = shield(
  {
    Query: {
      post: and(isAuthenticated, isOwnerOfPost),
      posts: and(isAuthenticated, or(isAdmin, isEditor)),
    },
    Mutation: {
      createPost: isAuthenticated,
      updatePost: and(isAuthenticated, isOwnerOfPost),
      deletePost: and(isAuthenticated, or(isOwnerOfPost, isEditor, isAdmin)),
    },
  },
  {
    debug: process.env.NODE_ENV !== 'production',
  },
)

// Server

const server = new GraphQLServer({
  typeDefs: './src/generated/prisma.graphql',
  resolvers: {},
  middlewares: [permissions, forwardMiddleware],
  context: (req) => ({
    ...req,
    db: new Prisma({
      endpoint: process.env.PRISMA_ENDPOINT,
      debug: process.env.NODE_ENV !== 'production',
    }),
  }),
})
server.start(() => console.log('Server is running on http://localhost:4000'))
