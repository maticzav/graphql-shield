import test from 'ava'
import { shield, PermissionError } from '../dist/src/index.js'

// Setup

const _resolvers = {
   Query: {
      open: () => 'open',
      simple: () => `simple`,
      logic: (_, { agent }) => agent,
      failing: () => 'failing'
   },
   Subscription: {
      counter: {
         subscribe: () => 'subscribed',
      }
   },
   Fragment: {
      count: {
         fragment: 'fragment',
         resolve: () => 'count'
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
   NoResolver: () => true,
   Fragment: {
      count: (_, { code }) => code === 'code'
   }
}

const setup = () => shield(_resolvers, _permissions)

// Tests ---------------------------------------------------------------------

test('Allow simple permission.', async t => {
   const resolvers = setup()

   const res = await resolvers.Query.simple()
   t.is(res , 'simple')
})

test('Allow permission with logic.', async t => {
   const resolvers = setup()

   const res = await resolvers.Query.logic({}, { code: 'code', agent: 'agent' })
   t.is(res, 'agent')
})

test('Permit resolver with no permission.', async t => {
   const resolvers = setup()

   const resolver = resolvers.Query.open
   t.is(res, undefined)
})

test('Permit simple permission.', async t => {
   const resolvers = setup()

   const error = await t.throws(resolvers.Query.failing())
   t.is(error.message, `Insufficient Permissions.`)
})

test('Permit permission with logic.', async t => {
   const resolvers = setup()

   const error = await t.throws(resolvers.Query.logic({}, { code: 'wrong', agent: 'doesntmatter' }))
   t.is(error.message, `Insufficient Permissions.`)
})

test('Create permission and resolver for permission with no resolver defined.', async t => {
   const resolvers = setup()

   const resolver = resolvers.NoResolver.other
   t.not(resolver, undefined)
})

test('Keep subscription format.', async t => {
   const resolvers = setup()

   const resolver = resolvers.Subscription.counter.subscribe
   t.not(resolver, undefined)
})

test('Allow Subscription access.', async t => {
   const resolvers = setup()

   const res = await resolvers.Subscription.counter.subscribe({}, { code: 'code' })
   t.is(res, 'subscribed')
})

test('Permit Subscription access.', async t => {
   const resolvers = setup()

   const error = await t.throws(resolvers.Subscription.counter.subscribe({}, { code: 'wrong' }))
   t.is(error.message, `Insufficient Permissions.`)
})

test('Keep Fragment format.', async t => {
   const resolvers = setup()

   const resolver = resolvers.Fragment.count
   t.true(exists(resolver.fragment) && exists(resolver.resolve))
})

test('Fragment copied correctly.', async t => {
   const resolvers = setup()

   const resolver = resolvers.Fragment.count
   t.is(resolver.fragment, 'fragment')
})

test('Allow Fragment access.', async t => {
   const resolvers = setup()

   const res = await resolvers.Fragment.count.resolve({}, { code: 'code' })
   t.is(res, 'count')
})

test('Permit Fragment access.', async t => {
   const resolvers = setup()

   const error = await t.throws(resolvers.Fragment.count.resolve({}, { code: 'wrong' }))
   t.is(error.message, `Insufficient Permissions.`)
})

// Helpers -------------------------------------------------------------------

function exists(val)  {
   return val !== undefined && val !== null && val !== {}
}