import test from 'ava'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { shield } from '../dist/src/index.js'

// Setup
const _users = [
   { id: '1', name: 'user1', secret: 'secret1' },
   { id: '2', name: 'user2', secret: 'secret2' },
   { id: '3', name: 'user3', secret: 'secret3' },
]

const _typeDefs = `
   type User {
      id: String!
      name: String!
      secret: String!
   }

   type Query {
      users: [User!]!
   }

   schema {
      query: Query
   }
`

const _resolvers = {
   Query: {
      users: () => users
   },
}

const auth = t => (_, { code }) => {
   t.pass()
   return code === 'code'
}

const _permissions = {
   Query: {
      users: auth
   },
   User: {
      secret: auth
   }
}

const setup = (options) => makeExecutableSchema({
   typeDefs: _typeDefs,
   resolvers: shield(_resolvers, _permissions, options)
})


// Tests

test('Working cache.', async t => {
   const schema = setup()

   const query = `{
      users(code: "code") {

      }
   }`

   t.pass()
})

test.todo('No caching when disabled.')