import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from 'graphql-tools'
import { shield, rule, and, not, or } from '../src/index'
import { allow } from '../src/constructors'

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
        user: User
        events: [Event!]
      }

      type User {
        id: ID!
        name: String!
      }

      type Event {
        id: ID!
        location: String!
        published: Boolean
      }
    `

    /* Permissions */

    const isUserSelf = rule({
      fragment: 'fragment UserId on User { id }',
    })(async (parent, args, ctx, info) => {
      return true
    })

    const isProfilePublic = rule({
      fragment: 'fragment UserPublic on User { public }',
    })(async (parent, args, ctx, info) => {
      return true
    })

    const isEventPublished = rule({
      fragment: '... on Event { published }',
    })(async () => {
      return true
    })

    const permissions = shield({
      Query: {
        user: allow,
        events: allow,
      },
      User: or(isUserSelf, isProfilePublic),
      Event: isEventPublished,
    })

    const { fragmentReplacements } = applyMiddleware(
      makeExecutableSchema({ typeDefs, resolvers: {} }),
      permissions,
    )

    expect(fragmentReplacements).toEqual([
      {
        field: 'id',
        fragment: '... on User {\n  public\n}',
      },
      {
        field: 'name',
        fragment: '... on User {\n  id\n}',
      },
      {
        field: 'name',
        fragment: '... on User {\n  public\n}',
      },
      {
        field: 'id',
        fragment: '... on Event {\n  published\n}',
      },
      {
        field: 'location',
        fragment: '... on Event {\n  published\n}',
      },
    ])
  })
})
