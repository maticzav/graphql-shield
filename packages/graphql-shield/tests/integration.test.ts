import { makeExecutableSchema } from '@graphql-tools/schema'
import { gql, ApolloServer } from 'apollo-server'
import fetch from 'node-fetch'
import { applyMiddleware } from 'graphql-middleware'

import { shield, allow, deny } from '../src'

describe('integration tests', () => {
  test('works with ApolloServer', async () => {
    /* Schema */

    const typeDefs = gql`
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

    /* Permissions */

    const permissions = shield({
      Query: {
        allow: allow,
        deny: deny,
      },
    })

    const server = new ApolloServer({
      schema: applyMiddleware(makeExecutableSchema({ typeDefs, resolvers }), permissions),
    })

    await server.listen({ port: 8008 })
    const uri = `http://localhost:8008/`

    /* Tests */

    const query = `
      query {
        allow
        deny
      }
    `

    const res = await fetch(uri, {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => res.json())

    // @ts-expect-error - TS doesn't know that the response is JSON
    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    // @ts-expect-error - TS doesn't know that the response is JSON
    expect(res.errors.length).toBe(1)

    await server.stop()
  })
})
