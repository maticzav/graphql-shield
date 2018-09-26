import test from 'ava'
import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, and, not, or } from '../index'

test('Extracts fragment from rule correctly.', async t => {
  const ruleWithFragment = rule({ fragment: 'pass' })(() => true)

  t.is(ruleWithFragment.extractFragment(), 'pass')
})

test('Extracts fragment from logic rule correctly.', async t => {
  const ruleWithNoFragment = rule()(() => true)
  const ruleWithFragmentA = rule({ fragment: 'pass-A' })(() => true)
  const ruleWithFragmentB = rule({ fragment: 'pass-B' })(() => true)
  const ruleWithFragmentC = rule({ fragment: 'pass-C' })(() => true)

  const logicRuleAND = and(
    ruleWithNoFragment,
    ruleWithFragmentA,
    ruleWithFragmentB,
  )
  const logicRuleNOT = not(logicRuleAND)
  const logicRuleOR = or(ruleWithFragmentB, ruleWithFragmentC, logicRuleNOT)

  t.deepEqual(logicRuleOR.extractFragments(), [
    'pass-B',
    'pass-C',
    'pass-A',
    'pass-B',
  ])
})

test('Applies rule-fragment correctly accross type.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c: String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const ruleWithFragment = rule({
    fragment: 'pass',
  })(async (parent, args, ctx, info) => {
    return true
  })

  const permissions = shield({
    Query: ruleWithFragment,
  })

  const { fragmentReplacements } = applyMiddleware(schema, permissions)

  t.deepEqual(fragmentReplacements, [
    {
      field: 'a',
      fragment: 'pass',
    },
    {
      field: 'b',
      fragment: 'pass',
    },
    {
      field: 'c',
      fragment: 'pass',
    },
  ])
})

test('Applies logic rule fragments correctly accross type.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c: String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const logicRuleWithFragment = and(
    rule({
      fragment: 'logic-pass-A',
    })(async (parent, args, ctx, info) => {
      return true
    }),
    rule({
      fragment: 'logic-pass-B',
    })(async (parent, args, ctx, info) => {
      return true
    }),
  )

  const permissions = shield({
    Query: logicRuleWithFragment,
  })

  const { fragmentReplacements } = applyMiddleware(schema, permissions)

  t.deepEqual(fragmentReplacements, [
    {
      field: 'a',
      fragment: 'logic-pass-A',
    },
    {
      field: 'a',
      fragment: 'logic-pass-B',
    },
    {
      field: 'b',
      fragment: 'logic-pass-A',
    },
    {
      field: 'b',
      fragment: 'logic-pass-B',
    },
    {
      field: 'c',
      fragment: 'logic-pass-A',
    },
    {
      field: 'c',
      fragment: 'logic-pass-B',
    },
  ])
})

test('Applies rule-fragment correctly to a specific field.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c: String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const ruleWithFragment = rule({
    fragment: 'pass',
  })(async (parent, args, ctx, info) => {
    return true
  })

  const permissions = shield({
    Query: {
      a: ruleWithFragment,
    },
  })

  const { fragmentReplacements } = applyMiddleware(schema, permissions)

  t.deepEqual(fragmentReplacements, [
    {
      field: 'a',
      fragment: 'pass',
    },
  ])
})

test('Applies logic rule-fragment correctly to a specific field.', async t => {
  // Schema
  const typeDefs = `
    type Query {
      a: String!
      b: String!
      c: String!
    }
  `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
      c: () => 'c',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  // Permissions
  const logicRuleWithFragment = and(
    rule({
      fragment: 'logic-pass-A',
    })(async (parent, args, ctx, info) => {
      return true
    }),
    rule({
      fragment: 'logic-pass-B',
    })(async (parent, args, ctx, info) => {
      return true
    }),
  )

  const permissions = shield({
    Query: {
      a: logicRuleWithFragment,
    },
  })

  const { fragmentReplacements } = applyMiddleware(schema, permissions)

  t.deepEqual(fragmentReplacements, [
    {
      field: 'a',
      fragment: 'logic-pass-A',
    },
    {
      field: 'a',
      fragment: 'logic-pass-B',
    },
  ])
})
