import * as Yup from 'yup'
import { rule, and, or, not, allow, deny, inputRule, chain } from '../src/constructors'
import { RuleAnd, RuleOr, RuleNot, RuleTrue, RuleFalse, Rule, InputRule, RuleChain } from '../src/rules'

describe('rule constructor', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('correctly constructs from no arguments', async () => {
    /* Mocks */

    const n = Math.random()
    jest.spyOn(Math, 'random').mockReturnValue(n)

    /* Tests */

    const func = () => true

    expect(rule()(func)).toEqual(new Rule(n.toString(), func, {}))
  })

  test('correctly constructs with name and options', async () => {
    const func = () => true

    expect(
      rule('name', {
        cache: 'contextual',
        fragment: 'fragment',
      })(func),
    ).toEqual(new Rule('name', func, { cache: 'contextual', fragment: 'fragment' }))
  })

  test('correctly constructs with name but no options', async () => {
    const func = () => true

    expect(rule('name')(func)).toEqual(new Rule('name', func, {}))
  })

  test('correctly constructs with options', async () => {
    /* Mocks */
    const n = Math.random()
    jest.spyOn(Math, 'random').mockReturnValue(n)

    /* Tests */

    const func = () => true

    expect(
      rule({
        cache: 'contextual',
        fragment: 'fragment',
      })(func),
    ).toEqual(
      new Rule(n.toString(), func, {
        cache: 'contextual',
        fragment: 'fragment',
      }),
    )
  })
})

describe('input rules constructor', () => {
  test('correnctly constructs an input rule with name', async () => {
    const name = Math.random().toString()
    let schema: Yup.ObjectSchema<{}>

    const rule = inputRule(name)((yup) => {
      schema = yup.object().shape({}).required()
      return schema
    })
    expect(JSON.stringify(rule)).toEqual(JSON.stringify(new InputRule(name, () => schema)))
  })

  test('correnctly constructs an input rule', async () => {
    const n = Math.random()
    jest.spyOn(Math, 'random').mockReturnValue(n)

    let schema: Yup.ObjectSchema<{}>

    const rule = inputRule()((yup) => {
      schema = yup.object().shape({}).required()
      return schema
    })
    expect(JSON.stringify(rule)).toEqual(JSON.stringify(new InputRule(n.toString(), () => schema)))
  })

  test('correctly contructs an input rule with validation options', async () => {
    const n = Math.random()
    jest.spyOn(Math, 'random').mockReturnValue(n)

    let schema: Yup.ObjectSchema<{}>
    let options = { abortEarly: false }

    const rule = inputRule()((yup) => {
      schema = yup.object().shape({}).required()
      return schema
    }, options)
    expect(JSON.stringify(rule)).toEqual(JSON.stringify(new InputRule(n.toString(), () => schema, options)))
  })
})

describe('logic rules constructors', () => {
  test('and correctly constructs rule and', async () => {
    const ruleA = rule()(() => true)
    const ruleB = rule()(() => true)
    expect(and(ruleA, ruleB)).toEqual(new RuleAnd([ruleA, ruleB]))
  })

  test('chain correctly constructs rule chain', async () => {
    const ruleA = rule()(() => true)
    const ruleB = rule()(() => true)
    expect(chain(ruleA, ruleB)).toEqual(new RuleChain([ruleA, ruleB]))
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
