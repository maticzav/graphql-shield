import { graphql } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { shield, rule, allow } from '../src/index'

describe('fallbackError correctly handles errors', () => {
  test('error in resolver returns fallback error.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: String!
      }
    `
    const resolvers = {
      Query: {
        test: async () => {
          throw new Error()
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */

    const fallbackError = new Error('fallback')

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      fallbackError,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(fallbackError.message)
  })

  test('error in rule returns fallback error.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: String!
      }
    `

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: {},
    })

    /* Permissions */

    const fallbackError = new Error('fallback')

    const allow = rule()(() => {
      throw new Error()
    })

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      fallbackError,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(fallbackError.message)
  })

  test('correctly converts string fallbackError to error fallbackError', async () => {
    /* Schema */

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

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const fallbackMessage = Math.random().toString()
    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      fallbackError: fallbackMessage,
    })

    /* Execution */
    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(fallbackMessage)
  })

  test('error in rule can be mapped.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: String!
      }
    `

    const schema = makeExecutableSchema({ typeDefs, resolvers: {} })

    /* Permissions */

    const fallbackError = () => new Error('fallback')

    const allow = rule()(() => {
      throw new Error()
    })

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      fallbackError,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(fallbackError().message)
  })

  test('error in resolver can be mapped.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: String!
      }
    `
    const resolvers = {
      Query: {
        test: async () => {
          throw new Error()
        },
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */

    const fallbackError = () => new Error('fallback')

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      fallbackError,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(fallbackError().message)
  })
})

describe('external errors can be controlled correctly', () => {
  test('error in resolver with allowExternalErrors returns external error.', async () => {
    /* Schema */

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

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      allowExternalErrors: true,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe('external')
  })

  test('error in rule with allowExternalErrors returns fallback.', async () => {
    /* Schema */
    const typeDefs = `
      type Query {
        test: String!
      }
    `

    const schema = makeExecutableSchema({ typeDefs, resolvers: {} })

    /* Permissions */

    const allow = rule()(() => {
      throw new Error('external')
    })

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      allowExternalErrors: true,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe('Not Authorised!')
  })
})

describe('debug mode works as expected', () => {
  test('returns original error in debug mode when rule error occurs', async () => {
    /* Schema */
    const typeDefs = `
      type Query {
        test: String!
      }
    `

    const schema = makeExecutableSchema({ typeDefs, resolvers: {} })

    /* Permissions */

    const allow = rule()(() => {
      throw new Error('debug')
    })

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      debug: true,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe('debug')
  })

  test('returns original error in debug mode when resolver error occurs.', async () => {
    /* Schema */

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

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const ruleTree = {
      Query: allow,
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      debug: true,
    })

    /* Execution */

    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe('debug')
  })
})

describe('custom errors work as expected', () => {
  test('custom error in rule returns custom error.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: String!
      }
    `

    const schema = makeExecutableSchema({ typeDefs, resolvers: {} })

    /* Permissions */

    const error = new Error(`${Math.random()}`)
    const ruleTree = {
      Query: rule()(() => {
        return error
      }),
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(error.message)
  })

  test('custom error message in rule returns custom error.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: String!
      }
    `

    const schema = makeExecutableSchema({ typeDefs, resolvers: {} })

    /* Permissions */

    const error = `${Math.random()}`

    const ruleTree = {
      Query: rule()(() => {
        return error
      }),
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        test
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toBeNull()
    expect(res.errors?.[0]?.message).toBe(error)
  })
})

describe('fallbackRule correctly applies fallback rule', () => {
  test('correctly applies fallback rule on undefined fields', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        b: String
        type: Type
      }

      type Type {
        a: String
        b: String
      }
    `

    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        type: () => ({}),
      },
      Type: {
        a: () => 'a',
        b: () => 'b',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const fallbackRuleMock = jest.fn().mockResolvedValue(true)
    const fallbackRule = rule({ cache: 'no_cache' })(fallbackRuleMock)

    const ruleTree = {
      Query: {
        a: allow,
        type: allow,
      },
    }

    const schemaWithPermissions = shield(schema, ruleTree, {
      fallbackRule: fallbackRule,
    })

    /* Execution */

    const query = `
      query {
        a
        b
        type {
          a
          b
        }
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res).toEqual({
      data: {
        a: 'a',
        b: 'b',
        type: {
          a: 'a',
          b: 'b',
        },
      },
    })
    expect(fallbackRuleMock).toBeCalledTimes(3)
  })
})
