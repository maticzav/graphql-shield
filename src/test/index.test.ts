import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule } from '../index'

test('Rule allow access (promise).', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule()(async (parent, args, ctx, info) => {
    return true
  })

  const permissions = shield({
    Query: {
      test: allow,
    },
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.deepEqual(res, {
    data: {
      test: 'pass',
    },
  })
})

test('Rule allow access (immediate).', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule()((parent, args, ctx, info) => {
    return true
  })

  const permissions = shield({
    Query: {
      test: allow,
    },
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.deepEqual(res, {
    data: {
      test: 'pass',
    },
  })
})

test('Rule deny access (promise).', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const deny = rule()(async (parent, args, ctx, info) => {
    return false
  })

  const permissions = shield({
    Query: {
      test: deny,
    },
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
})

test('Rule deny access (immediate).', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const deny = rule()((parent, args, ctx, info) => {
    return false
  })

  const permissions = shield({
    Query: {
      test: deny,
    },
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
})
