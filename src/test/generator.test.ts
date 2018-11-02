import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, allow, deny } from '../'

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

test('Generator - fallbackRule deny permissions.', async t => {
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
      fallbackRule: deny,
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

test('Generator - fallbackRule allow permissions.', async t => {
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
        deny: deny,
      },
      Test: {
        deny: deny,
      },
    },
    { fallbackRule: allow },
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

test('Generator - fallbackRule custom permissions.', async t => {
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
  const customRule = rule()((parent, args, ctx) => {
    return ctx.allow === true
  })
  // Permissions
  const permissions = shield(
    {
      Query: {
        allow: allow,
        deny: deny,
      },
      Test: {
        allow: allow,
        deny: deny,
      },
    },
    {
      fallbackRule: customRule,
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
  const ctx1 = { allow: true }
  const res = await graphql(schemaWithPermissions, query, undefined, ctx1)
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
  const ctx2 = { allow: false }
  const res2 = await graphql(schemaWithPermissions, query, undefined, ctx2)
  t.deepEqual(res2.data, {
    check: null,
    allow: {
      check: null,
      allow: 'pass',
      deny: null,
    },
    deny: null,
  })
  t.not(res2.errors.length, 0)
})

test('Generator - throws if both whitelist and fallbackRule are specified.', async t => {
  t.throws(
    () => {
      shield(
        {
          Query: {
            deny: deny,
          },
          Test: {
            deny: deny,
          },
        },
        { whitelist: true, fallbackRule: allow },
      )
    },
    {
      message:
        'You specified both `whitelist` and `fallbackRule`. Please use one or the other.',
    },
  )
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
