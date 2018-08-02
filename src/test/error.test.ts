import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, error, allow } from '../index'

test('Error in resolver, fallback.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => {
        throw new Error()
      },
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Fallback

  const fallback = new Error('fallback')

  // Permissions
  const permissions = shield(
    {
      Query: allow,
    },
    {
      fallback,
    },
  )

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
  t.is(res.errors[0].message, fallback.message)
})

test('Error in rule, fallback.', async t => {
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

  // Fallback

  const fallback = new Error('fallback')

  // Permissions
  const allow = rule()(() => {
    throw new Error()
  })

  const permissions = shield(
    {
      Query: allow,
    },
    {
      fallback,
    },
  )

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
  t.is(res.errors[0].message, fallback.message)
})

test('Error in resolver, allow external errors.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => {
        throw new Error('external')
      },
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const permissions = shield(
    {
      Query: allow,
    },
    {
      allowExternalErrors: true,
    },
  )

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
  t.is(res.errors[0].message, 'external')
})

test('Error in rule, allow external errors.', async t => {
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
  const allow = rule()(() => {
    throw new Error('external')
  })

  const permissions = shield(
    {
      Query: allow,
    },
    {
      allowExternalErrors: true,
    },
  )

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
  t.is(res.errors[0].message, 'external')
})

test('Custom error message in rule.', async t => {
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
  const allow = rule()(() => {
    return error('custom')
  })

  const permissions = shield({
    Query: allow,
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
  t.is(res.errors[0].message, 'custom')
})

test('Return original error in debug mode.', async t => {
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
  const allow = rule()(() => {
    throw new Error('debug')
  })

  const permissions = shield(
    {
      Query: allow,
    },
    {
      allowExternalErrors: true,
    },
  )

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.is(res.data, null)
  t.is(res.errors[0].message, 'debug')
})
