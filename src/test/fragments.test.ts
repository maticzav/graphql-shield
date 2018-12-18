import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, and, not, or } from '../index'

describe('Fragment extraction', () => {
  test('Extracts fragment from rule correctly.', async () => {
    const ruleWithFragment = rule({ fragment: 'pass' })(() => true)
    expect(ruleWithFragment.extractFragment()).toBe('pass')
  })

  test('Extracts fragment from logic rule correctly.', async () => {
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

    expect(logicRuleOR.extractFragments()).toEqual([
      'pass-B',
      'pass-C',
      'pass-A',
      'pass-B',
    ])
  })
})

describe('Fragment application', () => {
  test('Applies rule-fragment correctly.', async () => {
    /* Schema */
    const typeDefs = `
      type Query {
        a: String!
        logicB: String!
      }

      type Type {
        typeA: String!
        typeB: String!
      }

      type LogicType {
        logicTypeA: String!
        logicTypeB: String!
      }
    `

    // rule accross type, logic rule accross type, rule to specific field, logic rule to specific field

    /* Permissions */

    const ruleWithFragment = rule({
      fragment: 'fragment',
    })(async (parent, args, ctx, info) => {
      return true
    })

    const logicRuleWithFragment = and(
      rule({
        fragment: 'fragment-a',
      })(async (parent, args, ctx, info) => true),
      rule({
        fragment: 'fragment-b',
      })(async (parent, args, ctx, info) => true),
    )

    const permissions = shield({
      Query: {
        a: ruleWithFragment,
        logicB: logicRuleWithFragment,
      },
      Type: ruleWithFragment,
      LogicType: logicRuleWithFragment,
    })

    const { fragmentReplacements } = applyMiddleware(
      makeExecutableSchema({ typeDefs, resolvers: {} }),
      permissions,
    )

    expect(fragmentReplacements).toEqual([
      {
        field: 'a',
        fragment: 'fragment',
      },
      {
        field: 'logicB',
        fragment: 'fragment-a',
      },
      {
        field: 'logicB',
        fragment: 'fragment-b',
      },
      {
        field: 'typeA',
        fragment: 'fragment',
      },
      {
        field: 'typeB',
        fragment: 'fragment',
      },
      {
        field: 'logicTypeA',
        fragment: 'fragment-a',
      },
      {
        field: 'logicTypeA',
        fragment: 'fragment-b',
      },
      {
        field: 'logicTypeB',
        fragment: 'fragment-a',
      },
      {
        field: 'logicTypeB',
        fragment: 'fragment-b',
      },
    ])
  })
})
