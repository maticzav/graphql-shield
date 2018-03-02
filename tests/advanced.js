import test from 'ava'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, PermissionError } from '../dist/src/index.js'

// Setup

const _typeDefs = `
   type Query {
      users(take: Int): [User!]!
      someNewHiddenFeature: String!
   }

   type Mutation {
      mutationWithArgument(arg: String!): String!
      mutationWithFragment: String!
   }

   type Subscription {
      notifications: [String!]!
   }

   type User {
      name: String!
      diary(code: String!): Diary!
   }

   type Diary {
      quote: String!
      topSecret: String!
   }

   schema {
      query: Query
      mutation: Mutation
      subscription: Subscription
   }
`

const _resolvers = {
   Query: {
      users: () => [{
         name: 'jack',
         diary: {
            quote: 'awesome',
            topSecret: 'secret'
         }
      }],
      someNewHiddenFeature: () => 'hidden'
   },
   Mutation: {
      mutationWithArgument: (_, { arg }) => arg,
      mutationWithFragment: {
         fragment: ' fragment Foo on User { id } ',
         resolve: () => 'fragment'
      }
   },
   Subscription: {
      notifications: {
         subscribe: () => ['notify']
      }
   },
   User: {
      name: (parent) => parent.name,
      diary: (parent) => parent.diary
   },
   Diary: {
      quote: (parent) => parent.quote,
      topSecret: (parent) => parent.topSecret
   }
}

const _auth = (parent, { code }) => code === 'secret'

const _permissions = {
   Query: {
      users: () => true
   },
   Mutation: {
      mutationWithArgument: () => true,
      mutationWithFragment: () => true,
   },
   Subscription: {
      notifications: () => true
   },
   User: {
      name: () => true,
      diary: _auth
   },
   Diary: {
      quote: () => true,
   }
}

const setup = (options) => makeExecutableSchema({
   typeDefs: _typeDefs,
   resolvers: shield(_resolvers, _permissions, options)
})

// Tests

test('GQL allow simple permission.', async t => {
   const schema = setup({ debug: false })

   const query = `{
      users {
         name
      }
   }`
   const res = await graphql(schema, query)

   t.deepEqual(res, {
      data: {
         users: [{ name: 'jack' }]
      }
   })
})

test('GQL allow basic auth permission.', async t => {
   const schema = setup({ debug: false })
   
   const query = `{
      users {
         name
         diary(code: "secret") {
            quote
         }
      }
   }`
   const res = await graphql(schema, query)

   t.deepEqual(res, {
      data: {
         users: [{
            name: 'jack',
            diary: {
               quote: 'awesome'
            }
         }]
      }
   })
})

test('GQL permit basic auth permission.', async t => {
   const schema = setup({ debug: false })
   
   const query = `{
      users {
         name
         diary(code: "wrongcode") {
            quote
         }
      }
   }`
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})

test('GQL hide deep nested type-field.', async t => {
   const schema = setup({ debug: false })

   const query = `{
      users {
         name
         diary(code: "secret") {
            quote
            topSecret
         }
      }
   }`
   const res = await graphql(schema, query)

   t.is(res.data, null)
   t.not(res.errors, undefined)
})

test('GQL allow deep nested type-field in debug.', async t => {
   const schema = setup({ debug: true })

   const query = `{
      users {
         name
         diary(code: "secret") {
            quote
            topSecret
         }
      }
   }`
   const res = await graphql(schema, query)

   t.deepEqual(res, {
      data: {
         users: [{
            name: 'jack',
            diary: {
               quote: 'awesome',
               topSecret: 'secret'
            }
         }]
      }
   })
})


test('GQL argument correctly passed.', async t => {
   const schema = setup({ debug: false })
   
   const query = `
      mutation {
         mutationWithArgument(arg: "abc")
      }
   `
   const res = await graphql(schema, query)

   t.deepEqual(res, {
      data: {
         mutationWithArgument: "abc"
      }
   })
})

test('GQL Fragment correctly merged.', async t => {
   const schema = setup({ debug: false })

   const query = `
      mutation {
         mutationWithFragment
      }
   `
   const res = await graphql(schema, query)

   t.deepEqual(res, {
      data: {
         mutationWithFragment: "fragment"
      }
   })
})