import { rule, and, or, not, allow, deny } from '../constructors'
import { RuleAnd, RuleOr, RuleNot, RuleTrue, RuleFalse, Rule } from '../rules'

describe('rule constructor', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('correctly constructs from no arguments', async () => {
    /* Mocks */
    jest.spyOn(Math, 'random').mockImplementation(() => ({
      toString: () => 'name',
    }))

    /* Tests */

    const func = () => true

    expect(rule()(func)).toEqual(new Rule('name', func, {}))
  })

  test('correctly constructs with name and options', async () => {
    const func = () => true

    expect(
      rule('name', {
        cache: 'contextual',
        fragment: 'fragment',
      })(func),
    ).toEqual(
      new Rule('name', func, { cache: 'contextual', fragment: 'fragment' }),
    )
  })

  test('correctly constructs with name but no options', async () => {
    const func = () => true

    expect(rule('name')(func)).toEqual(new Rule('name', func, {}))
  })

  test('correctly constructs with options', async () => {
    /* Mocks */
    jest.spyOn(Math, 'random').mockImplementation(() => ({
      toString: () => 'name',
    }))

    /* Tests */

    const func = () => true

    expect(
      rule({
        cache: 'contextual',
        fragment: 'fragment',
      })(func),
    ).toEqual(
      new Rule('name', func, { cache: 'contextual', fragment: 'fragment' }),
    )
  })
})

describe('logic rules constructors', () => {
  test('and correctly constructs rule and', async () => {
    const ruleA = rule()(() => true)
    const ruleB = rule()(() => true)
    expect(and(ruleA, ruleB)).toEqual(new RuleAnd([ruleA, ruleB]))
  })

  test('or correctly constructs rule or', async () => {
    const ruleA = rule()(() => true)
    const ruleB = rule()(() => true)
    expect(or(ruleA, ruleB)).toEqual(new RuleOr([ruleA, ruleB]))
  })

  test('not correctly constructs rule not', async () => {
    const ruleA = rule()(() => true)
    expect(not(ruleA)).toEqual(new RuleNot(ruleA))
  })
})

describe('basic rules', () => {
  test('rule allow', async () => {
    expect(allow).toEqual(new RuleTrue())
  })

  test('rule deny', async () => {
    expect(deny).toEqual(new RuleFalse())
  })
})
