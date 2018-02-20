import test from 'ava'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, PermissionError } from '../dist/src/index.js'

// Setup

const _typeDefs = `
   type Query {
      text: String!
      list: [String!]!
      type: Type!
   }

   type Mutation {
      development: String!
   }

   type Type {
      property: String!
      properties: [String!]!
      hiddenProperty: String!
   }

   schema {
      query: Query,
      mutation: Mutation
   }
`

const _resolvers = {
   Query: {
      text: () => 'simpletext',
      list: () => ['firsttext', 'secondtext', 'thirdtext'],
      type: () => ({ 
         property: 'typeproperty', 
         properties: [
            'firsttypeproperty', 
            'secondtypeproperty', 
            'thirdtypeproperty'
         ],
         hiddenProperty: 'hiddentypeproperty'
      })
   },
   Mutation: {
      development: 'notpublic'
   }
}

const _permissions = {
   Query: () => true,
   Type: {
      property: () => true,
      properties: () => true
   }
}

const setup = (options) => makeExecutableSchema({
   resolvers: shield(_resolvers, _permissions, { debug: true }),
   typeDefs: _typeDefs
})

// Tests

test('GQL allow simple string access.', async t => {
   const schema = setup()

   const query = ` { text } `
   const res = await graphql(schema, query)

   t.deepEqual(res, { data: { text: 'simpletext' } })
})