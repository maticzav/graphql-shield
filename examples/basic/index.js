import { rule, gqlShield, allow } from 'graphql-shield'

// Rules

@rule
async function isAuthenticated(parent, args, ctx, info) {
  return ctx.user !== null
}

// Permissions

const permissions = shield({
  Query: allow,
  Viewer: isAuthenticated
})

const server = GraphQLYoga({
  schema,
  middlewares: [permissions]
})