import { execute, graphql, parse } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { rule, and, not, or } from '../src/index'
import { allow } from '../src/constructors'
import { generateMiddlewareFromSchemaAndRuleTree } from '../src/generator'
import { getFragmentReplacements, normalizeOptions, shield, wrapExecuteFn } from '../src/shield'

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

    const logicRuleAND = and(ruleWithNoFragment, ruleWithFragmentA, ruleWithFragmentB)
    const logicRuleNOT = not(logicRuleAND)
    const logicRuleOR = or(ruleWithFragmentB, ruleWithFragmentC, logicRuleNOT)

    expect(logicRuleOR.extractFragments()).toEqual(['pass-B', 'pass-C', 'pass-A', 'pass-B'])
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
        fullName: String!
        public: Boolean!
      }

      type Event {
        id: ID!
        location: String!
        published: Boolean
      }
    `

    const resolvers = {
      Query: {
        user: () => ({
          id: '1',
          name: 'John',
          public: true,
        }),
        events: () => [
          {
            id: '1',
            location: 'London',
            published: true,
          },
        ],
      },
      User: {
        fullName: (parent: any) => parent.name,
      },
    }

    /* Permissions */

    const isUserSelfMock = jest.fn((parent, args, ctx, info) => true)

    const isUserSelf = rule({
      fragment: 'fragment UserIdFullName on User { id fullName }',
    })(async (parent, args, ctx, info) => {
      return isUserSelfMock(parent, args, ctx, info)
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

    const ruleTree = {
      Query: {
        user: allow,
        events: allow,
      },
      User: or(isUserSelf, isProfilePublic),
      Event: isEventPublished,
    }

    const schema = makeExecutableSchema({ typeDefs, resolvers })

    const fragmentReplacements = getFragmentReplacements(
      generateMiddlewareFromSchemaAndRuleTree(schema, ruleTree, normalizeOptions({}), {
        excludeRulesWithoutFragments: true,
        excludeRulesWithFragments: false,
      }),
    )

    expect(fragmentReplacements).toEqual([
      {
        field: 'id',
        fragment: '... on User {\n  fullName\n}',
      },
      {
        field: 'id',
        fragment: '... on User {\n  public\n}',
      },
      {
        field: 'name',
        fragment: '... on User {\n  id\n  fullName\n}',
      },
      {
        field: 'name',
        fragment: '... on User {\n  public\n}',
      },
      {
        field: 'fullName',
        fragment: '... on User {\n  id\n}',
      },
      {
        field: 'fullName',
        fragment: '... on User {\n  public\n}',
      },
      {
        field: 'public',
        fragment: '... on User {\n  id\n  fullName\n}',
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

    // const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */
    const query = `
      query {
        user {
          name
        }
        events {
          id
        }
      }
    `
    const res = await wrapExecuteFn(execute, { schema, ruleTree })({
      schema,
      document: parse(query),
    })

    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    // })

    expect(res).toEqual({
      data: {
        user: {
          name: 'John',
        },
        events: [
          {
            id: '1',
          },
        ],
      },
    })

    expect(isUserSelfMock).toBeCalledTimes(1)
    expect(isUserSelfMock.mock.calls[0][0]).toEqual({
      fullName: 'John',
      id: '1',
      name: 'John',
      public: true,
    })
  })
})
