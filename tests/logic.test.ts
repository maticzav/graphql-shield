import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, allow, deny, and, or, not } from '../src'
import { LogicRule } from '../src/rules'

describe('logic rules', () => {
  test('allow, deny work as expeted', async () => {
    const typeDefs = `
      type Query {
        allow: String
        deny: String
      }
    `

    const resolvers = {
      Query: {
        allow: () => 'allow',
        deny: () => 'deny',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    // Permissions
    const permissions = shield({
      Query: {
        allow: allow,
        deny: deny,
      },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */

    const query = `
      query {
        allow
        deny
      }
    `
    const res = await graphql(schemaWithPermissions, query)

    /* Tests */

    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    expect(res.errors.length).toBe(1)
  })

  test('and works as expected', async () => {
    const typeDefs = `
      type Query {
        allow: String
        deny: String
        ruleError: String
      }
    `

    const resolvers = {
      Query: {
        allow: () => 'allow',
        deny: () => 'deny',
        ruleError: () => 'ruleError',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const ruleWithError = rule()(async () => {
      throw new Error()
    })

    const permissions = shield({
      Query: {
        allow: and(allow, allow),
        deny: and(allow, deny),
        ruleError: and(allow, ruleWithError),
      },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */

    const query = `
      query {
        allow
        deny
      }
    `
    const res = await graphql(schemaWithPermissions, query)

    /* Tests */

    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    expect(res.errors.length).toBe(1)
  })

  test('or works as expected', async () => {
    const typeDefs = `
      type Query {
        allow: String
        deny: String
      }
    `

    const resolvers = {
      Query: {
        allow: () => 'allow',
        deny: () => 'deny',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const permissions = shield({
      Query: {
        allow: or(allow, deny),
        deny: or(deny, deny),
      },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */

    const query = `
      query {
        allow
        deny
      }
    `
    const res = await graphql(schemaWithPermissions, query)

    /* Tests */

    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    expect(res.errors.length).toBe(1)
  })

  test('not works as expected', async () => {
    const typeDefs = `
      type Query {
        allow: String
        deny: String
        ruleError: String
        resolverError: String
      }
    `

    const resolvers = {
      Query: {
        allow: () => 'allow',
        deny: () => 'deny',
        ruleError: () => 'ruleError',
        resolverError: () => {
          throw new Error()
        },
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const ruleWithError = rule()(async () => {
      throw new Error()
    })

    const permissions = shield({
      Query: {
        allow: not(deny),
        deny: not(allow),
        ruleError: not(ruleWithError),
        resolverError: not(allow),
      },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */

    const query = `
      query {
        allow
        deny
        ruleError
        resolverError
      }
    `
    const res = await graphql(schemaWithPermissions, query)

    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
      ruleError: 'ruleError',
      resolverError: null,
    })
    expect(res.errors.length).toBe(2)
  })
})

describe('internal execution', () => {
  test('logic rule by default resolves to false', async () => {
    const rule = new LogicRule([])

    const res = await rule.resolve(
      {},
      {},
      {},
      {},
      {
        allowExternalErrors: false,
        debug: false,
        fallbackRule: undefined,
        fallbackError: new Error(),
      },
    )

    expect(res).toBeFalsy()
  })

  test('rule prevents access when access not permited', async () => {
    const typeDefs = `
      type Query {
        deny: String
      }
    `

    const resolvers = {
      Query: {
        deny: () => 'deny',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const ruleDeny = rule()(() => false)

    const permissions = shield({
      Query: {
        deny: ruleDeny,
      },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */

    const query = `
      query {
        deny
      }
    `
    const res = await graphql(schemaWithPermissions, query)

    /* Tests */

    expect(res.data).toEqual({
      deny: null,
    })
    expect(res.errors.length).toBe(1)
  })
})
