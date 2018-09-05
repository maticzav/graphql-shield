import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, allow, deny, and, or, not } from '../index'
import { LogicRule } from '../rules'

test('Logic Allow.', async t => {
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

test('Logic Deny.', async t => {
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

test('Logic AND - all rules pass, allow.', async t => {
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
  const permissions = shield({
    Query: {
      test: and(allow, allow, allow),
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

test('Logic AND - some rules pass, deny.', async t => {
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
  const permissions = shield({
    Query: {
      test: and(allow, allow, deny),
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

test('Logic AND - some rules throw, deny.', async t => {
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
  const ruleError = rule()(() => {
    throw new Error()
  })

  const permissions = shield(
    {
      Query: {
        test: and(allow, allow, ruleError),
      },
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
})

test('Logic AND - some rules return error, deny', async t => {
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
  const testError = new Error('test')
  const ruleError = rule()(() => testError)

  const permissions = shield(
    {
      Query: {
        test: and(allow, allow, ruleError),
      },
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
  t.is(res.errors[0].message, testError.message)
})

test('Logic OR - some rules pass, allow.', async t => {
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
  const permissions = shield({
    Query: {
      test: or(allow, allow, deny),
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

test('Logic OR - no rule passes, deny', async t => {
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
  const permissions = shield({
    Query: {
      test: or(deny, deny, deny),
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

test('Logic OR - some rules return error, deny', async t => {
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
  const testError = new Error('test')
  const ruleError = rule()(() => testError)

  const permissions = shield({
    Query: {
      test: or(deny, deny, ruleError),
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
  t.is(res.errors[0].message, testError.message)
})

test('Logic NOT - true -> false, deny.', async t => {
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
  const permissions = shield({
    Query: {
      test: not(allow),
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

test('Logic NOT - false -> true, allow.', async t => {
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
  const permissions = shield({
    Query: {
      test: not(deny),
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

test('Logic NOT - fallback error -> true, allow.', async t => {
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
  const fail = rule()(async (parent, args, ctx, info) => {
    throw new Error()
  })

  const permissions = shield({
    Query: {
      test: not(fail),
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

test('Logic NOT - custom error -> true, allow.', async t => {
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
  const fail = rule()(async (parent, args, ctx, info) => {
    return false
  })

  const permissions = shield({
    Query: {
      test: not(fail),
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

test('Logic NOT - rule error -> true, allow.', async t => {
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
  const fail = rule()(async (parent, args, ctx, info) => {
    throw new Error()
  })

  const permissions = shield(
    {
      Query: {
        test: not(fail),
      },
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

  t.deepEqual(res, {
    data: {
      test: 'pass',
    },
  })
})

test('Logic rule by default resolves to false', async t => {
  const rule = new LogicRule([])
  const res = await rule.resolve(
    {},
    {},
    {},
    {},
    {
      allowExternalErrors: false,
      debug: false,
      whitelist: false,
      graphiql: true,
      fallback: new Error(),
    },
  )

  t.false(res)
})
