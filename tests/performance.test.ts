import { makeExecutableSchema } from 'graphql-tools'
import { applyMiddleware } from 'graphql-middleware'
import { graphql } from 'graphql'
import { shield, allow } from '../src'

describe('performance tests', () => {
  test('resolves 10000 fields in less than 150ms', async () => {
    const typeDefs = `
      type Query {
        users: [User!]!
      }

      type User {
        col0: Int
        col1: Int
        col2: Int
        col3: Int
        col4: Int
        col5: Int
        col6: Int
        col7: Int
        col8: Int
        col9: Int
      }
    `

    const users = new Array(1000).fill(null).map((_, i) => ({
      col0: i,
      col1: i,
      col2: i,
      col3: i,
      col4: i,
      col5: i,
      col6: i,
      col7: i,
      col8: i,
      col9: i,
    }))

    const resolvers = {
      Query: { users: () => Promise.resolve(users) },
    }

    const permissions = shield({
      Query: { users: allow },
    })

    const schema = makeExecutableSchema({ typeDefs, resolvers })
    const schemaWithPermissions = applyMiddleware(schema, permissions)

    const query = `
      {
        users {
          col0
          col1
          col2
          col3
          col4
          col5
          col6
          col7
          col8
          col9
        }
      }
    `
    const now = Date.now()
    await graphql(schemaWithPermissions, query)
    const after = Date.now()

    expect(after - now).toBeLessThanOrEqual(150)
  })
})
