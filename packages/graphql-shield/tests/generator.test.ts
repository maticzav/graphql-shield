import { makeExecutableSchema } from '@graphql-tools/schema'
import { isAsyncIterable } from '@graphql-tools/utils'
import { graphql, parse, subscribe } from 'graphql'
import { shield, rule } from '../src'

describe('generates correct middleware', () => {
  test('correctly applies schema rule to schema', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        type: Type
      }
      type Type {
        a: String
      }
    `

    const resolvers = {
      Query: {
        a: () => 'a',
        type: () => ({}),
      },
      Type: {
        a: () => 'a',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const schemaRule = rule({ cache: 'no_cache' })(allowMock)

    const schemaWithPermissions = shield(schema, schemaRule)

    /* Execution */
    const query = `
      query {
        a
        type {
          a
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
        type: {
          a: 'a',
        },
      },
    })
    expect(allowMock).toBeCalledTimes(3)
  })

  test('correctly applies type rule to type', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        type: Type
      }
      type Type {
        a: String
      }
    `

    const resolvers = {
      Query: {
        a: () => 'a',
        type: () => ({}),
      },
      Type: {
        a: () => 'a',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const ruleTree = {
      Query: rule({ cache: 'no_cache' })(allowMock),
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        a
        type {
          a
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
        type: {
          a: 'a',
        },
      },
    })
    expect(allowMock).toBeCalledTimes(2)
  })

  test('correctly applies field rule to field', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        type: Type
      }
      type Type {
        a: String
      }
    `

    const resolvers = {
      Query: {
        a: () => 'a',
        type: () => ({}),
      },
      Type: {
        a: () => 'a',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const ruleTree = {
      Query: { a: rule({ cache: 'no_cache' })(allowMock) },
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        a
        type {
          a
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
        type: {
          a: 'a',
        },
      },
    })
    expect(allowMock).toBeCalledTimes(1)
  })

  test.only('correctly applies subscription rule', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        q: String
      }
      type Subscription {
        a: Int
      }
      type Type {
        a: String
      }
    `

    const resolvers = {
      Subscription: {
        a: {
          subscribe: async function* () {
            for (let counter = 1; counter <= 5; counter++) {
              yield { a: counter }
              await new Promise((res) => setTimeout(res, 1000))
            }
          },
        },
      },
      Type: {
        a: () => 'a',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const ruleTree = {
      Subscription: {
        a: rule({ cache: 'no_cache' })(allowMock),
      },
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      subscription {
        a
      }
    `

    const subscription = await subscribe({
      schema: schemaWithPermissions,
      document: parse(query),
    })

    /* Tests */

    expect(isAsyncIterable(subscription)).toBe(true)

    expect(await ('next' in subscription && subscription.next())).toEqual({
      done: false,
      value: {
        data: {
          a: 1,
        },
      },
    })

    expect(await ('next' in subscription && subscription.next())).toEqual({
      done: false,
      value: {
        data: {
          a: 2,
        },
      },
    })

    expect(allowMock).toBeCalledTimes(3)
  })

  test('correctly applies wildcard rule to type', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        b: String
        type: Type
      }
      type Type {
        field1: String
        field2: String
      }
    `

    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        type: () => ({
          field1: 'field1',
          field2: 'field2',
        }),
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const defaultQueryMock = jest.fn().mockResolvedValue(true)
    const defaultTypeMock = jest.fn().mockResolvedValue(true)

    const ruleTree = {
      Query: {
        a: rule({ cache: 'no_cache' })(allowMock),
        type: rule({ cache: 'no_cache' })(jest.fn().mockResolvedValue(true)),
        '*': rule({ cache: 'no_cache' })(defaultQueryMock),
      },
      Type: {
        '*': rule({ cache: 'no_cache' })(defaultTypeMock),
      },
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        a
        b
        type {
          field1
          field2
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
          field1: 'field1',
          field2: 'field2',
        },
      },
    })
    expect(allowMock).toBeCalledTimes(1)
    expect(defaultQueryMock).toBeCalledTimes(1)
    expect(defaultTypeMock).toBeCalledTimes(2)
  })

  test('correctly allows multiple uses of the same wildcard rule', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String
        b: String
        type: Type
      }
      type Type {
        field1: String
        field2: String
      }
    `

    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        type: () => ({
          field1: 'field1',
          field2: 'field2',
        }),
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const defaultQueryMock = jest.fn().mockResolvedValue(true)
    const defaultTypeMock = jest.fn().mockResolvedValue(true)

    const ruleTree = {
      Query: {
        a: rule({ cache: 'no_cache' })(allowMock),
        type: rule({ cache: 'no_cache' })(jest.fn().mockResolvedValue(true)),
        '*': rule({ cache: 'no_cache' })(defaultQueryMock),
      },
      Type: {
        '*': rule({ cache: 'no_cache' })(defaultTypeMock),
      },
    }

    /* First usage */
    shield(schema, ruleTree)

    /* Second usage */
    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        a
        b
        type {
          field1
          field2
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
          field1: 'field1',
          field2: 'field2',
        },
      },
    })
    expect(allowMock).toBeCalledTimes(1)
    expect(defaultQueryMock).toBeCalledTimes(1)
    expect(defaultTypeMock).toBeCalledTimes(2)
  })
})
