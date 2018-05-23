import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, and, or, CustomError } from './dist'

// Setup ---------------------------------------------------------------------

const typeDefs = `
  type Query {
    allow: String!
    deny: String!
    nullable: String
    nested: NestedType!
    cacheA: String!
    cacheB: String!
    noCacheA: String!
    noCacheB: String!
    customError: String!
    typeWide: Type!
    logicANDAllow: String!
    logicANDDeny: String!
    logicORAllow: String!
    logicORDeny: String!
    logicNested: String!
  }

  type Type {
    a: String!
    b: String!
    c: String!
  }

  type NestedType {
    allow: String!
    deny: String!
    cacheA: String!
    cacheB: String!
    noCacheA: String!
    noCacheB: String!
    nested: NestedType!
    logicANDAllow: String!
    logicANDDeny: String!
    logicORAllow: String!
    logicORDeny: String!
    logicNested: String!
  }
`

const resolvers = {
  Query: {
    allow: () => 'allow',
    deny: () => 'deny',
    nullable: () => null,
    nested: () => ({}),
    cacheA: () => 'cacheA',
    cacheB: () => 'cacheB',
    noCacheA: () => 'noCacheA',
    noCacheB: () => 'noCacheB',
    customError: () => 'customError',
    logicANDAllow: () => 'logicANDAllow',
    logicANDDeny: () => 'logicANDDeny',
    logicORAllow: () => 'logicORAllow',
    logicORDeny: () => 'logicORDeny',
    logicNested: () => 'logicNested',
  },
  Type: {
    a: () => 'a',
    b: () => 'b',
    c: () => 'c',
  },
  NestedType: {
    allow: () => 'allow',
    deny: () => 'dent',
    cacheA: () => 'cacheA',
    cacheB: () => 'cacheB',
    noCacheA: () => 'noCacheA',
    noCacheB: () => 'noCacheB',
    nested: () => ({}),
    logicANDAllow: () => 'logicANDAllow',
    logicANDDeny: () => 'logicANDDeny',
    logicORAllow: () => 'logicORAllow',
    logicORDeny: () => 'logicORDeny',
    logicNested: () => 'logicNested',
  },
}

const getSchema = () => makeExecutableSchema({ typeDefs, resolvers })

// Shield --------------------------------------------------------------------

const allow = rule('allow')(async (parent, args, ctx, info) => {
  return true
})

const deny = rule('deny')(async (parent, args, ctx, info) => {
  return false
})

const cache = t =>
  rule('cache')(async (parent, args, ctx, info) => {
    t.pass()
    return true
  })

const noCache = t =>
  rule('no_cache', { cache: false })(async (parent, args, ctx, info) => {
    t.pass()
    return true
  })

const customError = rule('customError')(async (parent, args, ctx, info) => {
  throw CustomError('customError')
})

const logicAndAllow = t => and(allow, cache(t), noCache(t))
const logicAndDeny = t => and(allow, cache(t), noCache(t), deny)
const logicOrAllow = t => or(allow, cache(t), noCache(t))
const logicOrDeny = t => or(deny, deny)
const logicNested = t => and(logicAndAllow(t), logicOrDeny(t))

const getPermissions = t =>
  shield({
    Query: {
      allow: allow,
      deny: deny,
      nullable: deny,
      cacheA: cache(t),
      cacheB: cache(t),
      noCacheA: noCache(t),
      noCacheB: noCache(t),
      customError: customError,
      logicANDAllow: logicAndAllow(t),
      logicANDDeny: logicAndDeny(t),
      logicORAllow: logicOrAllow(t),
      logicORDeny: logicOrDeny(t),
    },
    NestedType: {
      allow: allow,
      deny: deny,
      cacheA: cache(t),
      cacheB: cache(t),
      noCacheA: noCache(t),
      noCacheB: noCache(t),
      logicANDAllow: logicAndAllow(t),
      logicANDDeny: logicAndDeny(t),
      logicORAllow: logicOrAllow(t),
      logicORDeny: logicOrDeny(t),
    },
    Type: deny,
  })

// Helpers
const getTestsSchema = t => {
  const _schema = getSchema()
  const permissions = getPermissions(t)

  return applyMiddleware(_schema, permissions)
}

const resolves = (t, schema) => async (query, expected) => {
  const res = await graphql(schema, query, null, {})

  t.is(res.errors, undefined)
  t.deepEqual(res.data, expected)
}

const fails = (t, schema) => async (query, errorMessage) => {
  const res = await graphql(schema, query, null, {})

  t.is(res.data, null)
  t.is(res.errors[0].message, errorMessage)
}

// Tests ---------------------------------------------------------------------

// Allow

test('shield:Allow access', async t => {
  const schema = getTestsSchema()
  const query = `
    query {
      allow
    }
  `
  const expected = {
    allow: 'allow',
  }

  await resolves(t, schema)(query, expected)
})

// Deny

test('shield:Deny access', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      deny
    }
  `

  await fails(t, schema)(query, 'Not Authorised!')
})

// Nullable

test('shield:Nullable access', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      allow
      nullable
    }
  `

  const res = await graphql(schema, query, null, {})

  t.deepEqual(res.data, {
    allow: 'allow',
    nullable: null,
  })
  t.is(res.errors[0].message, 'Not Authorised!')
})

// Nested

test('shield:Nested: Allow access', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      nested {
        allow
      }
    }
  `
  const expected = {
    nested: {
      allow: 'allow',
    },
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Nested: Deny acccess', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      nested {
        deny
      }
    }
  `

  await fails(t, schema)(query, 'Not Authorised!')
})

// Cache

test('shield:Cache: One type-level cache', async t => {
  t.plan(3)
  const schema = getTestsSchema(t)
  const query = `
    query {
      cacheA
      cacheB
    }
  `
  const expected = {
    cacheA: 'cacheA',
    cacheB: 'cacheB',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Cache: One type-level without cache', async t => {
  t.plan(4)
  const schema = getTestsSchema(t)
  const query = `
    query {
      noCacheA
      noCacheB
    }
  `
  const expected = {
    noCacheA: 'noCacheA',
    noCacheB: 'noCacheB',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Cache:Nested: Two type-level with cache', async t => {
  t.plan(3)
  const schema = getTestsSchema(t)
  const query = `
    query {
      cacheA
      cacheB
      nested {
        cacheA
        cacheB
      }
    }
  `
  const expected = {
    cacheA: 'cacheA',
    cacheB: 'cacheB',
    nested: {
      cacheA: 'cacheA',
      cacheB: 'cacheB',
    },
  }

  await resolves(t, schema)(query, expected)
})
