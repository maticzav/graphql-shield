import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule } from '../index'

test('Strict cache - Rule is called multiple times, based on different parent.', async t => {
  t.plan(2 + 1)

  // Schema
  const typeDefs = `
    type Query {
      test: [Test!]!
    }

    type Test {
      value: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => [
        { value: 'pass-A' },
        { value: 'pass-A' },
        { value: 'pass-B' },
      ],
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule({ cache: 'strict' })(parent => {
    t.pass()
    return true
  })

  const permissions = shield({
    Test: allow,
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test {
        value
      }
    }
  `
  const res = await graphql(schemaWithPermissions, query, undefined, {})

  t.deepEqual(res, {
    data: {
      test: [{ value: 'pass-A' }, { value: 'pass-A' }, { value: 'pass-B' }],
    },
  })
})

test('Strict cache - Cache is normalised correctly, rule is called multiple times, based on different parent.', async t => {
  t.plan(2 + 1)

  // Schema
  const typeDefs = `
    type Query {
      test: [Test!]!
    }

    type Test {
      value: String!
    }
  `
  const resolvers = {
    Query: {
      test: () => [
        { value: 'pass-A' },
        { value: 'pass-A' },
        { value: 'pass-B' },
      ],
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule({ cache: true })(parent => {
    t.pass()
    return true
  })

  const permissions = shield({
    Test: allow,
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      test {
        value
      }
    }
  `
  const res = await graphql(schemaWithPermissions, query, undefined, {})

  t.deepEqual(res, {
    data: {
      test: [{ value: 'pass-A' }, { value: 'pass-A' }, { value: 'pass-B' }],
    },
  })
})

test('Strict cache - Rule is called multiple times, based on different arguments.', async t => {
  t.plan(3 + 1)

  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c(arg: String): String!
      d(arg: String): String!
      e(arg: String): String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
      d: () => 'd',
      e: () => 'e',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule({ cache: 'strict' })(parent => {
    t.pass()
    return true
  })

  const permissions = shield({
    Query: allow,
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      a
      b
      c(arg: "foo")
      d(arg: "bar")
      e
    }
  `
  const res = await graphql(schemaWithPermissions, query, undefined, {})

  t.deepEqual(res, {
    data: {
      a: 'a',
      b: 'b',
      c: 'c',
      d: 'd',
      e: 'e',
    },
  })
})

test('Contextual Cache - rules get executed only once if reused.', async t => {
  t.plan(2 + 1)

  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c(arg: String): String!
      d(arg: String): String!
      e(arg: String): String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
      d: () => 'd',
      e: () => 'e',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const ruleOne = rule({ cache: 'contextual' })(parent => {
    t.pass()
    return true
  })

  const ruleTwo = rule({ cache: 'contextual' })(parent => {
    t.pass()
    return true
  })

  const permissions = shield({
    Query: {
      a: ruleOne,
      b: ruleOne,
      c: ruleOne,
      d: ruleTwo,
      e: ruleTwo,
    },
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      a
      b
      c(arg: "foo")
      d(arg: "bar")
      e
    }
  `
  const res = await graphql(schemaWithPermissions, query, undefined, {})

  t.deepEqual(res, {
    data: {
      a: 'a',
      b: 'b',
      c: 'c',
      d: 'd',
      e: 'e',
    },
  })
})

test('No Cache - rule is reexecuted every time.', async t => {
  t.plan(5 + 1)

  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c(arg: String): String!
      d(arg: String): String!
      e(arg: String): String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
      d: () => 'd',
      e: () => 'e',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule({ cache: 'no_cache' })(parent => {
    t.pass()
    return true
  })

  const permissions = shield({
    Query: allow,
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      a
      b
      c(arg: "foo")
      d(arg: "bar")
      e
    }
  `
  const res = await graphql(schemaWithPermissions, query, undefined, {})

  t.deepEqual(res, {
    data: {
      a: 'a',
      b: 'b',
      c: 'c',
      d: 'd',
      e: 'e',
    },
  })
})

test('No Cache - Cache is normalised correctly, rule is reexecuted every time.', async t => {
  t.plan(5 + 1)

  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c(arg: String): String!
      d(arg: String): String!
      e(arg: String): String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
      d: () => 'd',
      e: () => 'e',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const allow = rule({ cache: false })(parent => {
    t.pass()
    return true
  })

  const permissions = shield({
    Query: allow,
  })

  const schemaWithPermissions = applyMiddleware(schema, permissions)

  // Execution
  const query = `
    query {
      a
      b
      c(arg: "foo")
      d(arg: "bar")
      e
    }
  `
  const res = await graphql(schemaWithPermissions, query, undefined, {})

  t.deepEqual(res, {
    data: {
      a: 'a',
      b: 'b',
      c: 'c',
      d: 'd',
      e: 'e',
    },
  })
})
