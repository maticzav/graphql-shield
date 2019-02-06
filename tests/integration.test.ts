import { makeExecutableSchema } from 'graphql-tools'
import { GraphQLServer as YogaServer } from 'graphql-yoga'
import { gql, ApolloServer } from 'apollo-server'
import * as request from 'request-promise-native'
import { AddressInfo } from 'ws'
import { applyMiddleware } from 'graphql-middleware'
import { shield, allow, deny } from '../src'

describe('integration tests', () => {
  test('works with GraphQL Yoga', async () => {
    /* Schema */

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

    /* Permissions */

    const permissions = shield({
      Query: {
        allow: allow,
        deny: deny,
      },
    })

    const server = new YogaServer({
      typeDefs,
      resolvers,
      middlewares: [permissions],
    })

    const http = await server.start({ port: 0 })
    const { port } = http.address() as AddressInfo
    const uri = `http://localhost:${port}/`

    /* Tests */

    const query = `
      query {
        allow
        deny
      }
    `

    const res = await request({
      uri,
      method: 'POST',
      json: true,
      body: { query },
    }).promise()

    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    expect(res.errors.length).toBe(1)
  })

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
      schema: applyMiddleware(
        makeExecutableSchema({ typeDefs, resolvers }),
        permissions,
      ),
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

    const res = await request({
      uri,
      method: 'POST',
      json: true,
      body: { query },
    }).promise()

    expect(res.data).toEqual({
      allow: 'allow',
      deny: null,
    })
    expect(res.errors.length).toBe(1)
  })
})
