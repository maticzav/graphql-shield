import test from 'ava'
import { shield } from '../dist/src/index.js'

// Setup

const resolvers = {
   Query: {
      hello: (_, { name }) => `Hello ${name || 'World'}`,
      secret: (_, { agent }) => `Hello agent ${agent}`,
   },
}

const permissions = {
   Query: {
      hello: () => true,
      secret: (_, { code }) => code === 'donttellanyone'
   }
}

// Tests

test.todo('Fragments')