import test from 'ava'
import { rule, and, not, or } from '../index'

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
