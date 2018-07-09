import test from 'ava'
import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, allow, deny, and, or, not, CustomError } from './dist'

// Setup ---------------------------------------------------------------------

const typeDefs = `
  type Query {
    allow: String!
    deny: String!
    nullable: String
    nested: NestedType!
    cacheA: String! # backward compatibility
    cacheB: String! # backward compatibility
    noCacheA: String!
    noCacheB: String!
    contextualCacheA: String!
    contextualCacheB: String!
    strictCacheA: String!
    strictCacheB: String!
    customErrorRule: String!
    customErrorResolver: String!
    debugError: String!
    typeWide: Type!
    logicANDAllow: String!
    logicANDDeny: String!
    logicORAllow: String!
    logicORDeny: String!
    logicNested: String!
    logicNOTAllow: String!
    logicNOTDeny: String!
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
    contextualCacheA: String!
    strictCacheA: String!
    nested: NestedType!
    logicANDAllow: String!
    logicANDDeny: String!
    logicORAllow: String!
    logicORDeny: String!
    logicNested: String!
    logicNOTAllow: String!
    logicNOTDeny: String!
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
    contextualCacheA: () => 'contextualCacheA',
    contextualCacheB: () => 'contextualCacheB',
    strictCacheA: () => 'strictCacheA',
    strictCacheB: () => 'strictCacheB',
    customErrorRule: () => 'customErrorRule',
    customErrorResolver: () => {
      throw new CustomError('customErrorResolver')
    },
    debugError: () => {
      throw new Error('debugError')
    },
    typeWide: () => ({}),
    logicANDAllow: () => 'logicANDAllow',
    logicANDDeny: () => 'logicANDDeny',
    logicORAllow: () => 'logicORAllow',
    logicORDeny: () => 'logicORDeny',
    logicNested: () => 'logicNested',
    logicNOTAllow: () => 'logicNOTAllow',
    logicNOTDeny: () => 'logicNOTDeny',
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
    contextualCacheA: () => 'contextualCacheA',
    strictCacheA: () => 'strictCacheA',
    nested: () => ({}),
    logicANDAllow: () => 'logicANDAllow',
    logicANDDeny: () => 'logicANDDeny',
    logicORAllow: () => 'logicORAllow',
    logicORDeny: () => 'logicORDeny',
    logicNested: () => 'logicNested',
    logicNOTAllow: () => 'logicNOTAllow',
    logicNOTDeny: () => 'logicNOTDeny',
  },
}

const getSchema = () => makeExecutableSchema({ typeDefs, resolvers })

// Shield --------------------------------------------------------------------

const getPermissions = t => {
  const cache = rule()(async (parent, args, ctx, info) => {
    t.pass()
    return true
  })

  const noCache = rule({ cache: 'no_cache' }, { cache: false })(
    async (parent, args, ctx, info) => {
      t.pass()
      return true
    },
  )

  const contextualCache = rule({ cache: 'contextual' })(
    async (parent, args, ctx, info) => {
      t.pass()
      return true
    },
  )

  const strictCache = rule({ cache: 'strict' })(
    async (parent, args, ctx, info) => {
      t.pass()
      return true
    },
  )

  const customErrorRule = rule()(async (parent, args, ctx, info) => {
    throw new CustomError('customErrorRule')
  })

  const logicAndAllow = and(allow, cache, noCache)
  const logicAndDeny = and(allow, cache, noCache, deny)
  const logicOrAllow = or(allow, cache, noCache)
  const logicOrDeny = or(deny, deny)
  const logicNested = and(logicAndAllow, logicOrDeny)
  const logicNotAllow = not(deny)
  const logicNotDeny = not(allow)

  return shield({
    Query: {
      allow: allow,
      deny: deny,
      nullable: deny,
      cacheA: cache,
      cacheB: cache,
      noCacheA: noCache,
      noCacheB: noCache,
      contextualCacheA: contextualCache,
      contextualCacheB: contextualCache,
      strictCacheA: strictCache,
      strictCacheB: strictCache,
      customErrorRule: customErrorRule,
      logicANDAllow: logicAndAllow,
      logicANDDeny: logicAndDeny,
      logicORAllow: logicOrAllow,
      logicORDeny: logicOrDeny,
      logicNOTAllow: logicNotAllow,
      logicNOTDeny: logicNotDeny,
    },
    NestedType: {
      allow: allow,
      deny: deny,
      cacheA: cache,
      cacheB: cache,
      noCacheA: noCache,
      noCacheB: noCache,
      contextualCacheA: contextualCache,
      strictCacheA: strictCache,
      logicANDAllow: logicAndAllow,
      logicANDDeny: logicAndDeny,
      logicORAllow: logicOrAllow,
      logicORDeny: logicOrDeny,
      logicNOTAllow: logicNotAllow,
      logicNOTDeny: logicNotDeny,
    },
    Type: deny,
  })
}

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

test('shield:Cache:Contextual: Equal parents', async t => {
  t.plan(3)
  const schema = getTestsSchema(t)
  const query = `
    query {
      contextualCacheA
      contextualCacheB
    }
  `
  const expected = {
    contextualCacheA: 'contextualCacheA',
    contextualCacheB: 'contextualCacheB',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Cache:Contextual: Different parents', async t => {
  t.plan(3)
  const schema = getTestsSchema(t)
  const query = `
    query {
      contextualCacheA
      nested {
        contextualCacheA
      }
    }
  `
  const expected = {
    contextualCacheA: 'contextualCacheA',
    nested: {
      contextualCacheA: 'contextualCacheA',
    },
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Cache:Strict: Equal parents.', async t => {
  t.plan(3)
  const schema = getTestsSchema(t)
  const query = `
    query {
      strictCacheA
      strictCacheB
    }
  `
  const expected = {
    strictCacheA: 'strictCacheA',
    strictCacheB: 'strictCacheB',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Cache:Strict: Different parents.', async t => {
  t.plan(4)
  const schema = getTestsSchema(t)
  const query = `
    query {
      strictCacheA
      nested {
        strictCacheA
      }
    }
  `
  const expected = {
    strictCacheA: 'strictCacheA',
    nested: {
      strictCacheA: 'strictCacheA',
    },
  }

  await resolves(t, schema)(query, expected)
})

// Logic

test('shield:Logic: Allow AND', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      logicANDAllow
    }
  `
  const expected = {
    logicANDAllow: 'logicANDAllow',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Logic: Deny AND', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      logicANDDeny
    }
  `
  const expected = {
    logicANDDeny: 'logicANDDeny',
  }

  await fails(t, schema)(query, 'Not Authorised!')
})

test('shield:Logic: Allow OR', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      logicORAllow
    }
  `
  const expected = {
    logicORAllow: 'logicORAllow',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Logic: Deny OR', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      logicORDeny
    }
  `
  await fails(t, schema)(query, 'Not Authorised!')
})

test('shield:Logic: Allow NOT', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      logicNOTAllow
    }
  `
  const expected = {
    logicNOTAllow: 'logicNOTAllow',
  }

  await resolves(t, schema)(query, expected)
})

test('shield:Logic: Deny NOT', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      logicNOTDeny
    }
  `
  await fails(t, schema)(query, 'Not Authorised!')
})

// Errors

test('shield:Error: Custom error in Rule', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      customErrorRule
    }
  `

  await fails(t, schema)(query, 'customErrorRule')
})

test('shield:Error: Custom error in Resolver', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      customErrorResolver
    }
  `

  await fails(t, schema)(query, 'customErrorResolver')
})

test('shield:Error: Debug error', async t => {
  const _schema = getSchema()
  const permissions = shield(
    {
      Query: {
        debugError: rule()(() => true),
      },
    },
    { debug: true },
  )

  const schema = applyMiddleware(_schema, permissions)
  const query = `
    query {
      debugError
    }
  `

  await fails(t, schema)(query, 'debugError')
})

test('shield:Error: AllowExternalErrors error', async t => {
  const _schema = getSchema()
  const permissions = shield(
    {
      Query: {
        debugError: rule()(() => true),
      },
    },
    { allowExternalErrors: true },
  )

  const schema = applyMiddleware(_schema, permissions)
  const query = `
    query {
      debugError
    }
  `

  await fails(t, schema)(query, 'debugError')
})

// Cache:Logic

test('shield:Cache:Logic: All caches', async t => {
  t.plan(5)
  const schema = getTestsSchema(t)
  const query = `
    query {
      cacheA
      cacheB
      logicANDAllow
      logicORAllow
    }
  `
  const expected = {
    cacheA: 'cacheA',
    cacheB: 'cacheB',
    logicANDAllow: 'logicANDAllow',
    logicORAllow: 'logicORAllow',
  }
  await resolves(t, schema)(query, expected)
})

// Type

test('shield:Type: Applies to entire type', async t => {
  const schema = getTestsSchema(t)
  const query = `
    query {
      typeWide {
        a
        b
        c
      }
    }
  `

  await fails(t, schema)(query, 'Not Authorised!')
})

// Schema
test('shield:Type: Applies to entire schema', async t => {
  const _schema = getSchema()
  const deny = rule()(() => false)

  const schema = applyMiddleware(_schema, shield(deny))
  const query = `
    query {
      allow
    }
  `

  await fails(t, schema)(query, 'Not Authorised!')
})

// Validation

test('shield:Validation: Fails with unvalid permissions.', async t => {
  const schema = getSchema()

  const ruleA = rule('a')(() => true)
  const ruleB = rule('a')(() => true)

  const permissionsError = t.throws(() => {
    shield({
      allow: ruleA,
      deny: ruleB,
    })
  }, Error)

  t.is(
    permissionsError.message,
    `Rule "a" seems to point to two different things.`,
  )
})
