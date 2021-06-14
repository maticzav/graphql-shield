import { graphql } from 'graphql'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, inputRule } from '../src'

describe('input rule', () => {
  test('schema validation works as expected', async () => {
    const typeDefs = `
      type Query {
        hello: String!
      }

      type Mutation {
        login(email: String!): String
      }
    `

    const resolvers = {
      Query: {
        hello: () => 'world',
      },
      Mutation: {
        login: () => 'pass',
      },
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    // Permissions
    const permissions = shield({
      Mutation: {
        login: inputRule()((yup) =>
          yup.object({
            email: yup.string().email('It has to be an email!').required(),
          }),
        ),
      },
    })

    const schemaWithPermissions = applyMiddleware(schema, permissions)

    /* Execution */

    const query = `
      mutation {
        success: login(email: "shield@graphql.com")
        failure: login(email: "notemail")
      }
    `
    const res = await graphql(schemaWithPermissions, query)

    /* Tests */

    expect(res.data).toEqual({
      success: 'pass',
      failure: null,
    })
    expect(res.errors).toMatchSnapshot()
  })
})
