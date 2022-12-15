import { graphql } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
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
    const ruleTree = {
      Mutation: {
        login: inputRule()((yup) =>
          yup.object({
            email: yup.string().email('It has to be an email!').required(),
          }),
        ),
      },
    }

    const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */

    const query = `
      mutation {
        success: login(email: "shield@graphql.com")
        failure: login(email: "notemail")
      }
    `
    const res = await graphql({
      schema: schemaWithPermissions,
      source: query,
    })

    /* Tests */

    expect(res.data).toEqual({
      success: 'pass',
      failure: null,
    })
    expect(res.errors).toMatchSnapshot()
  })
})
