import test from 'ava'
import { graphql } from 'graphql'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, PermissionError } from '../dist/src/index.js'

// Setup

const _typeDefs = `
   type Query {
      events(take: Int): [Event!]!
      someNewFeature: String!
   }

   type Mutation {
      
   }

   schema {
      query: Query,
      mutation: Mutation
   }
`

// Tests

test.todo('Advanced tests')