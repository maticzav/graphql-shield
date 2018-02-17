import test from 'ava'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { shield } from '../dist/src/index.js'

// Tests

test('Working cache.', async t => {
   t.plan(1)

   const _typeDefs = `
      type User {
         id: String!
         name: String!
         secret: String!
      }

      type Query {
         user: User
      }

      schema {
         query: Query
      }
   `

   const _resolvers = {
      Query: {
         user: () => ({ id: 'id', name: 'name', secret: 'secret' })
      },
   }

   const auth = () => {
      t.pass()
      return true
   }

   const _permissions = {
      Query: {
         user: auth
      },
      User: {
         secret: auth
      },
   }

   const schema = makeExecutableSchema({
      typeDefs: _typeDefs,
      resolvers: shield(_resolvers, _permissions)
   })

   const query = `{
      user {
         secret
      }
   }`
   const res = await graphql(schema, query)
})

test('No caching when disabled.', async t => {
   t.plan(3)

   const _typeDefs = `
      schema {
         query: Query
      }

      type Query {
         user: User
      }

      type User {
         id: String!
         name: String!
         bestFriend: Friend!
      }

      type Friend {
         id: String!
         name: String!
         secret: String!
      }
   `

   const _resolvers = {
      Query: {
         user: () => ({ 
            id: 'id', 
            name: 'name', 
            bestFriend: {
               id: 'fid',
               name: 'friend',
               secret: 'secret'
            }
         })
      },
   }

   const auth = () => {
      t.pass()
      return true
   }

   const _permissions = {
      Query: {
         user: auth
      },
      User: {
         bestFriend: auth
      },
      Friend: {
         secret: auth
      }
   }

   const schema = makeExecutableSchema({
      typeDefs: _typeDefs,
      resolvers: shield(_resolvers, _permissions, { cache: false })
   })

   const query = `{
      user {
         bestFriend {
            secret
         }
      }
   }`
   const res = await graphql(schema, query)
})