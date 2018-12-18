import { makeExecutableSchema } from 'graphql-tools'
import { applyMiddleware } from 'graphql-middleware'
import { shield, rule } from '../index'
import { graphql } from 'graphql'

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
    const permissions = shield(rule({ cache: 'no_cache' })(allowMock))

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */
    const query = `
      query {
        a
        type {
          a
        }
      }
    `

    const res = await graphql(schemaWithPermissions, query)

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
    const permissions = shield({
      Query: rule({ cache: 'no_cache' })(allowMock),
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */
    const query = `
      query {
        a
        type {
          a
        }
      }
    `

    const res = await graphql(schemaWithPermissions, query)

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
    const permissions = shield({
      Query: { a: rule({ cache: 'no_cache' })(allowMock) },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */
    const query = `
      query {
        a
        type {
          a
        }
      }
    `

    const res = await graphql(schemaWithPermissions, query)

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
})
