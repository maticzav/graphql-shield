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
    nested: NestedType!
    nullable: String
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
  }
`

const resolvers = {
  Query: {
    allow: () => 'allow',
    deny: () => 'deny',
    nested: () => ({}),
    nullable: () => null,
    cacheA: () => 'cacheA',
    cacheB: () => 'cacheB',
    noCacheA: () => 'noCacheA',
    noCacheB: () => 'noCacheB',
    customError: () => 'customError',
    logicANDAllow: () => 'logicANDAllow',
    logicANDDeny: () => 'logicANDDeny',
    logicORAllow: () => 'logicORAllow',
    logicORDeny: () => 'logicORDeny',
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
const logicOrAllow = t => and(allow, cache(t), noCache(t))
const logicOrDeny = t => and(deny, deny)

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

// Tests ---------------------------------------------------------------------

// Allow

test('shield:Allow access', async t => {
  const _schema = getSchema()
  const permissions = getPermissions(t)

  const schema = applyMiddleware(_schema, permissions)
  const query = `
    query {
      allow
    }
  `

  const res = await graphql(schema, query, null, {})
  t.deepEqual(res, {
    data: {
      allow: 'allow',
    },
  })
})

// Deny

test('shield:Deny access', async t => {
  const _schema = getSchema()
  const permissions = getPermissions(t)

  const schema = applyMiddleware(_schema, permissions)
  const query = `
    query {
      deny
    }
  `

  const res = await graphql(schema, query, null, {})

  t.is(res.data, null)
  t.is(res.errors[0].message, 'Not Authorised!')
})

// Nullable

test('shield:Nullable access', async t => {
  const _schema = getSchema()
  const permissions = getPermissions(t)

  const schema = applyMiddleware(_schema, permissions)
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
