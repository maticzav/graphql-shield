import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, allow, deny } from '../'

test('Generator - whitelist permissions.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      check: String
      allow: Test
      deny: Test
    }

    type Test {
      check: String
      allow: String
      deny: String
    }
  `
  const resolvers = {
    Query: {
      check: () => 'pass',
      allow: () => ({}),
      deny: () => ({}),
    },
    Test: {
      check: () => 'pass',
      allow: () => 'pass',
      deny: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const permissions = shield(
    {
      Query: {
        allow: allow,
      },
      Test: {
        allow: allow,
      },
    },
    {
      whitelist: true,
      debug: true,
    },
  )

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      check
      allow {
        check
        allow
        deny
      }
      deny {
        check
        allow
        deny
      }
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.deepEqual(res.data, {
    check: null,
    allow: {
      check: null,
      allow: 'pass',
      deny: null,
    },
    deny: null,
  })
  t.not(res.errors.length, 0)
})

test('Generator - blacklist permissions.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      check: String
      allow: Test
      deny: Test
    }

    type Test {
      check: String
      allow: String
      deny: String
    }
  `
  const resolvers = {
    Query: {
      check: () => 'pass',
      allow: () => ({}),
      deny: () => ({}),
    },
    Test: {
      check: () => 'pass',
      allow: () => 'pass',
      deny: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const permissions = shield({
    Query: {
      deny: deny,
    },
    Test: {
      deny: deny,
    },
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      check
      allow {
        check
        allow
        deny
      }
      deny {
        check
        allow
        deny
      }
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.deepEqual(res.data, {
    check: 'pass',
    allow: {
      check: 'pass',
      allow: 'pass',
      deny: null,
    },
    deny: null,
  })
  t.not(res.errors.length, 0)
})

test('Generator generates schema wide middleware correctly.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      test: String
      type: Test
    }

    type Test {
      typeTest: String
    }
  `
  const resolvers = {
    Query: {
      test: () => 'pass',
    },
    Test: {
      typeTest: () => 'pass',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  const permissions = shield(deny)

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test
      type {
        typeTest
      }
    }
  `
  const res = await graphql(schemaWithPermissions, query)

  t.deepEqual(res.data, {
    test: null,
    type: null,
  })
  t.not(res.errors.length, 0)
})
