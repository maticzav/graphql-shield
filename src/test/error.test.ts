import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, allow } from '../index'

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

test('Error in rule with allow external errors, returns fallback.', async t => {
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
  t.is(res.errors[0].message, 'Not Authorised!')
})

test('Custom error in rule.', async t => {
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
  const error = new Error(`${Math.random()}`)

  const allow = rule()(() => {
    return error
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
  t.is(res.errors[0].message, error.message)
})

test('Return original error in debug mode, rule.', async t => {
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
      debug: true,
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

test('Return original error in debug mode, resolver.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => {
        throw new Error('debug')
      },
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule()(() => {
    return true
  })

  const permissions = shield(
    {
      Query: allow,
    },
    {
      debug: true,
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
