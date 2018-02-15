import test from 'ava'
import { shield, PermissionError } from '../dist/src/index.js'

// Setup

const resolvers = {
   Query: {
      open: () => 'open',
      simple: () => `simple`,
      complex: (_, { agent }) => agent,
      failing: () => 'failing'
   },
}

const permissions = {
   Query: {
      simple: () => true,
      complex: (_, { code }) => code === 'code',
      failing: () => false
   },
   NoResolver: {
      other: () => true
   }
}

const setup = () => shield(resolvers, permissions)

// Tests

test('Allow simple permission', async t => {
   const resolvers = setup()

   const res = await resolvers.Query.simple()
   t.is(res , 'simple')
})

test('Allow complex permission', async t => {
   const resolvers = setup()

   const res = await resolvers.Query.complex({}, { code: 'code', agent: 'agent' })
   t.is(res, 'agent')
})

test('Allow open permission', async t => {
   const resolvers = setup()

   const res = await resolvers.Query.open()
   t.is(res, 'open')
})

test('Permit simple permission', async t => {
   const resolvers = setup()

   const error = await t.throws(resolvers.Query.failing())
   t.is(error.message, `Insufficient Permissions.`)
})

test('Permit complex permission', async t => {
   const resolvers = setup()

   const error = await t.throws(resolvers.Query.complex({}, { code: 'wrong', agent: 'doesntmatter' }))
   t.is(error.message, `Insufficient Permissions.`)
})

test('Creates identity permission resolver', async t => {
   const resolvers = setup()

   const resolver = resolvers.NoResolver.other
   t.not(resolver, undefined)
})