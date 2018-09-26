import test from 'ava'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { ValidationError } from '../validation'
import { shield, allow } from '../'

test('Finds a type missing in schema and warns developer.', async t => {
  // Schema
  const typeDefs = `
   type Query {
     a: String!
   }
 `
  const resolvers = {
    Query: {
      a: () => 'a',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions

  const permissions = shield({
    Query: allow,
    Fail1: allow,
    Fail2: allow,
  })

  t.throws(
    () => {
      applyMiddleware(schema, permissions)
    },
    {
      instanceOf: ValidationError,
      message: `It seems like you have applied rules to Fail1, Fail2 types but Shield cannot find them in your schema.`,
    },
  )
})

test('Finds the fields missing in schema and warns developer.', async t => {
  // Schema
  const typeDefs = `
   type Query {
     a: String!
   }
 `
  const resolvers = {
    Query: {
      a: () => 'a',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions

  const permissions = shield({
    Query: {
      a: allow,
      b: allow,
      c: allow,
    },
  })

  t.throws(
    () => {
      applyMiddleware(schema, permissions)
    },
    {
      instanceOf: ValidationError,
      message:
        'It seems like you have applied rules to Query.b, Query.c fields but Shield cannot find them in your schema.',
    },
  )
})
