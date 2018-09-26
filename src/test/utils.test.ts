import test from 'ava'
import {
  validateRules,
  isRule,
  isLogicRule,
  isRuleFieldMap,
  isRuleFunction,
  extractRules,
} from '../utils'
import { rule, and, or, not } from '../constructors'
import { ValidationError } from '../validation'

test('Extracts rules correctly', async t => {
  const rule1 = rule()(() => true)
  const rule2 = rule()(() => true)
  const rule3 = rule()(() => true)
  const rule4 = rule()(() => true)

  const rules = extractRules({
    Query: {
      foo: rule1,
      bar: rule2,
    },
    Qux: and(rule1, rule2),
    Not: not(rule1),
    Oreo: or(rule1, rule2),
    Mutation: rule3,
    Bar: rule4,
  })

  t.deepEqual(rules, [rule1, rule2, rule3, rule4])
})

test('Validates rules correctly, fails', async t => {
  const rule1 = rule('fail')(() => true)
  const rule2 = rule('fail')(() => true)
  const rule3 = rule()(() => true)
  const rule4 = rule()(() => true)

  t.throws(
    () => {
      validateRules({
        Query: {
          foo: rule1,
          bar: rule2,
        },
        Mutation: rule3,
        Bar: rule4,
      })
    },
    {
      instanceOf: ValidationError,
      message: `Rule "fail" seems to point at two different things.`,
    },
  )
})

test('Validates rules correctly, succeeds', async t => {
  const rule1 = rule()(() => true)
  const rule2 = rule()(() => true)
  const rule3 = rule()(() => true)
  const rule4 = rule()(() => true)

  const ruleTree = {
    Query: {
      foo: rule1,
      bar: rule2,
    },
    Mutation: rule3,
    Bar: rule4,
  }

  const validatedRuleTree = validateRules(ruleTree)

  t.is(ruleTree, validatedRuleTree)
})

test('isRuleFunction, true.', async t => {
  t.true(isRuleFunction(rule()(() => true)))
  t.true(isRuleFunction(and()))
})

test('isRuleFunction, false.', async t => {
  t.false(isRuleFunction(false))
})

test('isRule, true.', async t => {
  const pass = rule()(() => true)

  t.true(isRule(pass))
})

test('isRule, false.', async t => {
  t.false(isRule(false))
})

test('isLogicRule, true.', async t => {
  t.true(isLogicRule(and()))
})

test('isLogicRule, false.', async t => {
  t.false(isLogicRule(false))
})

test('isRuleFieldMap, true.', async t => {
  const pass = rule()(() => true)

  t.true(
    isRuleFieldMap({
      foo: pass,
      bar: pass,
    }),
  )
})

test('isRuleFieldMap, false.', async t => {
  const pass = rule()(() => true)

  t.false(
    isRuleFieldMap({
      foo: pass,
      bar: false,
    }),
  )
})
