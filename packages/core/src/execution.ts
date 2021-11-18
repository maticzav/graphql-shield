import * as tools from '@graphql-tools/utils'
import { GraphQLFieldResolver, GraphQLResolveInfo, GraphQLSchema } from 'graphql'

import { ShieldAuthorizationError } from './error'
import { Rule, RuleKind } from './rules'
import './types'
import { ExhaustiveSwitchCheck, PartialDeep } from './utils'

/*
This file contains code that we use to wrap resolvers with execution rules.
It heavily relies on `graphql-tools` and works similarly to how `graphql-middleware`
works. Relevant functions are wrapped in the rules that check if we may
actuall execute each of the requested resolvers.
 */

/**
 * Returns a wrapping function that lets us run execution permissions.
 */
export function getSchemaMapper<Context, T extends PartialDeep<GraphQLShield.GlobalRulesSchema<Context>>>(
  rules: T,
): (schema: GraphQLSchema) => GraphQLSchema {
  // Recursively executes the rules using given context and returns whether we allowed the execution or not.
  async function evaluate<Parent, Arguments>(
    rule: Rule<Parent, Arguments, Context>,
    parent: Parent,
    args: Arguments,
    context: Context,
    info: GraphQLResolveInfo,
    cache: Set<string>,
  ): Promise<boolean | ShieldAuthorizationError> {
    // Process the rules.
    switch (rule.kind) {
      case RuleKind.EXECUTION: {
        if (cache.has(rule.uuid)) {
          return true
        }

        const result = await rule.resolver(parent, args, context, info)
        if (result === true) {
          cache.add(rule.uuid)
          return true
        }
        return result
      }
      case RuleKind.ALLOW:
        return true
      case RuleKind.DENY:
        return false
      case RuleKind.VALIDATION:
        return true
      // Operators
      case RuleKind.CHAIN: {
        for (const subrule of rule.rules) {
          const result = await evaluate(subrule, parent, args, context, info, cache)
          if (result !== true) {
            return result
          }
        }

        // Cache the success of the execution.
        cache.add(rule.uuid)
        return true
      }
      case RuleKind.AND: {
        if (cache.has(rule.uuid)) {
          return true
        }

        return new Promise((resolve) => {
          let completed = false
          let remaining = rule.rules.length
          for (const subrule of rule.rules) {
            evaluate(subrule, parent, args, context, info, cache).then((result) => {
              if (completed) {
                return
              }

              remaining--

              if (result !== true) {
                completed = true
                resolve(result)
              }

              if (result && remaining === 0) {
                cache.add(rule.uuid)
                resolve(true)
              }
            })
          }
        })
      }

      case RuleKind.RACE: {
        if (cache.has(rule.uuid)) {
          return true
        }

        for (const subrule of rule.rules) {
          const result = await evaluate(subrule, parent, args, context, info, cache)
          if (result === true) {
            cache.add(rule.uuid)
            return true
          }
        }

        return false
      }
      case RuleKind.OR: {
        if (cache.has(rule.uuid)) {
          return true
        }

        return new Promise((resolve) => {
          let remaining = rule.rules.length
          let completed = false
          for (const subrule of rule.rules) {
            evaluate(subrule, parent, args, context, info, cache).then((result) => {
              if (completed) {
                return
              }
              remaining--

              if (result === true) {
                completed = true
                cache.add(rule.uuid)
                resolve(result)
              }

              if (!result && remaining === 0) {
                resolve(false)
              }
            })
          }
        })
      }

      default:
        throw new ExhaustiveSwitchCheck(rule)
    }
  }

  function composeWithRule<Parent, Arguments, Return>(
    rule: Rule<Parent, Arguments, Context>,
    resolve: GraphQLFieldResolver<Parent, Context, Arguments, Return>,
  ): GraphQLFieldResolver<Parent, Context, Arguments, Promise<Return>> {
    return async (parent, args, ctx, info) => {
      // We create a new cache for every field.
      const cache = new Set<string>()
      const evaluation = await evaluate(rule, parent, args, ctx, info, cache)

      if (evaluation === true) {
        return resolve(parent, args, ctx, info)
      }

      if (evaluation === false) {
        throw new Error("You don't have permissions to access this field.")
      }

      throw evaluation
    }
  }

  return (schema: GraphQLSchema): GraphQLSchema => {
    return tools.mapSchema(schema, {
      [tools.MapperKind.FIELD]: (field, fieldName, typeName) => {
        // Ignore input types.
        if (!('resolve' in field || 'subscribe' in field)) {
          return field
        }

        // Wrap resolver in the rule executor and selection extender.
        const rule = rules[typeName]?.[fieldName] || rules[typeName]?.['*'] || rules['*']
        const hasRuleDefinition = rule === undefined || rule === null

        // Compose resolver on regular fields.
        if (field.resolve) {
          if (hasRuleDefinition) {
            field.resolve = composeWithRule(rule, field.resolve)
          }
        }

        if (field.subscribe) {
        }

        return field
      },
    })
  }
}
