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
      type: () => ({})
   },
   Mutation: {
      development: () => 'notpublic'
   },
   Type: {
      property: () => 'typeproperty',
      properties: () => [
         'firsttypeproperty',
         'secondtypeproperty',
         'thirdtypeproperty'
      ],
      hiddenProperty: () => 'hiddentypeproperty'
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
   resolvers: shield(_resolvers, _permissions, options),
   typeDefs: _typeDefs
})

// Tests

test('GQL allow simple string access.', async t => {
   const schema = setup()

   const query = ` { text } `
   const res = await graphql(schema, query)

   t.deepEqual(res, { data: { text: 'simpletext' } })
})

test('GQL permit non-whitelisted query.', async t => {
   const schema = setup({ debug: false })

   const query = `
      mutation {
         development
      }
   `
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})

test('GQL allow non-whitelisted query in debug mode.', async t => {
   const schema = setup({ debug: true })

   const query = `
      mutation {
         development
      }
   `
   const res = await graphql(schema, query)

   t.deepEqual(res, { data: { development: 'notpublic' } })
})

test('GQL allow type-fields permissions.', async t => {
   const schema = setup()

   const query = `{
      type {
         property
         properties
      }
   }`
   const res = await graphql(schema, query)

   t.deepEqual(res, { 
      data: { 
         type: {
            property: 'typeproperty',
            properties: [
               'firsttypeproperty',
               'secondtypeproperty',
               'thirdtypeproperty'
            ]
         }
      } 
   })
})

test('GQL permit type-fields non-whitelisted permission.', async t => {
   const schema = setup({ debug: false })   

   const query = `{
      type {
         property
         properties
         hiddenProperty
      }
   }`
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})