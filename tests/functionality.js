import test from 'ava'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, PermissionError } from '../dist/src/index.js'

// Setup
const _typeDefs = `
   type Query {
      open: String!
      simple: String!
      logic(code: String!, agent: String!): String!
      failing: String!
      child: Child!
   }

   type Subscription {
      counter(code: String!): String!
   }

   type Child {
      name: String!
      age: Int!
      secret(code: String!): String!
   }

   type NoResolver {
      other: String!
   }

   schema {
      query: Query
      subscription: Subscription
   }
`

const _resolvers = {
   Query: {
      open: () => 'open',
      simple: () => `simple`,
      logic: (_, { agent }) => agent,
      failing: () => 'failing',
      child: () => ({ name: 'Matic', age: 9 })
   },
   Subscription: {
      counter: {
         subscribe: () => 'subscribed',
      }
   },
   Child: {
      secret: {
         fragment: 'fragment Secret on Matic { text }',
         resolve: () => 'supersecret'
      }
   }
}

const _permissions = {
   Query: {
      simple: () => true,
      logic: (_, { code }) => code === 'code',
      failing: () => false
   },
   Subscription: {
      counter: (_, { code }) => code === 'code'
   },
   NoResolver: {
      other: () => true
   },
   Child: {
      secret: (_, { code }) => code === 'code'
   }
}

const setup = () => makeExecutableSchema({
   typeDefs: _typeDefs,
   resolvers: shield(_resolvers, _permissions)
})


// Tests

test('GraphQL allow open request', async t => {
   const schema = setup()

   const query = ` { open } `
   const res = await graphql(schema, query)

   t.deepEqual(res, { data: { open: 'open' } })
})

test('GraphQL allow simple request', async t => {
   const schema = setup()

   const query = ` { simple } `
   const res = await graphql(schema, query)

   t.deepEqual(res, { data: { simple: 'simple' } })
})

test('GraphQL permit simple request', async t => {
   const schema = setup()

   const query = ` { failing } `
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})

test('GraphQL allow logic request', async t => {
   const schema = setup()

   const query = ` { logic(code: "code", agent: "matic") } `
   const res = await graphql(schema, query)

   t.deepEqual(res, { data: { logic: 'matic' } })
})

test('GraphQL permit logic request', async t => {
   const schema = setup()

   const query = ` { logic(code: "wrong", agent: "matic") } `
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})

test('GraphQL allow request with Fragment.', async t => {
   const schema = setup()   

   const query = ` { 
      child {
         name
         age
         secret(code: "code")
      } 
   } `
   const res = await graphql(schema, query)
   
   t.deepEqual(res, { 
      data: {
         child: {
            name: 'Matic',
            age: 9,
            secret: 'supersecret'
         }
      }
   })
})

test(' GraphQL perit request with Fragment.', async t => {
   const schema = setup()

   const query = ` { 
      child {
         name
         age
         secret(code: "wrong")
      } 
   } `
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})