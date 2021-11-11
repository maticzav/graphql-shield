import {
  ValidationRule,
  getNamedType,
  isIntrospectionType,
  isObjectType,
  isInterfaceType,
  isUnionType,
  FieldNode,
  GraphQLObjectType,
  GraphQLError,
  GraphQLSchema,
} from 'graphql'
import { ShieldAuthorizationError } from './error'

import { Rule, RuleKind } from './rules'
import './types'
import { ExhaustiveSwitchCheck, PartialDeep } from './utils'

const DEFAULT_INSUFFICIENT_PERMISSIONS_ERROR = `Insufficient permissions for selection.`

/**
 * Returns a custom execution function that works as a validation function.
 * Since we run all validation before actually executing the query, we only benefit
 * from having access to the context and don't trade any benefit of performing validation.
 */
export function getValidationRule<
  T extends PartialDeep<GraphQLShield.GlobalRulesSchema<Context>>,
  Context,
>(params: { rules: T; context: Context; schema: GraphQLSchema }): ValidationRule {
  // We cache the execution of the functions that allowed access to prevent duplicated
  // execution on the same context.
  const cache = new Set<string>()

  // Recursively executes the rules using given context and returns whether we allowed the execution or not.
  function evaluate(node: FieldNode, rule: Rule<any, any, Context>): boolean | ShieldAuthorizationError {
    // Make sure we still haven't finished executing.

    // Process the rules.
    switch (rule.kind) {
      case RuleKind.EXECUTION:
        return true
      case RuleKind.ALLOW:
        return true
      case RuleKind.DENY: {
        return false
      }
      case RuleKind.VALIDATION: {
        // Allow if we've already calculated and cached the result.
        if (cache.has(rule.uuid)) {
          return true
        }

        const result = rule.resolver(params.context)
        if (result === true) {
          cache.add(rule.uuid)
          return true
        }
        return false
      }
      // Operators
      case RuleKind.CHAIN:
      case RuleKind.AND: {
        for (const subrule of rule.rules) {
          const result = evaluate(node, subrule)
          if (result !== true) {
            return result
          }
        }

        // Cache the success of the execution.
        cache.add(rule.uuid)
        return true
      }
      case RuleKind.RACE:
      case RuleKind.OR: {
        for (const subrule of rule.rules) {
          const exec = evaluate(node, subrule)
          // At least one of the rules has to pass.
          if (exec === true) {
            cache.add(rule.uuid)
            return true
          }
        }

        return false
      }

      default:
        throw new ExhaustiveSwitchCheck(rule)
    }
  }

  return (context) => {
    // Handles the validation of a single field.
    const handleField = (node: FieldNode, objectType: GraphQLObjectType) => {
      const type = objectType.name
      const field = node.name.value

      // Execute the validation rule.
      const rule = params.rules[type]?.[field] || params.rules[type]?.['*'] || params.rules['*']

      if (rule) {
        const evaluation = evaluate(node, rule)

        if (evaluation !== true) {
          const message =
            evaluation instanceof ShieldAuthorizationError
              ? evaluation.message
              : DEFAULT_INSUFFICIENT_PERMISSIONS_ERROR
          const error = new GraphQLError(message, [node])
          context.reportError(error)
        }
      }
    }

    return {
      Field(node) {
        // Handle introspection case and always allow it.
        const type = context.getType()

        if (type) {
          const wrappedType = getNamedType(type)
          if (isIntrospectionType(wrappedType)) {
            return false
          }
        }

        // Handle the validation case.
        const parentType = context.getParentType()
        if (parentType) {
          if (isIntrospectionType(parentType)) {
            return false
          }

          // We handle objects, interface and union permissions differently.
          // When accessing an an object field, we check simply run the check.
          if (isObjectType(parentType)) {
            handleField(node, parentType)
          }

          // To allow a union case, every type in the union has to be allowed/
          // If one of the types doesn't permit access we should throw a validation error.
          if (isUnionType(parentType)) {
            for (const objectType of parentType.getTypes()) {
              handleField(node, objectType)
            }
          }

          // Same goes for interfaces. Every implementation should allow the access of the given
          // field to pass the validation rule.
          if (isInterfaceType(parentType)) {
            for (const objectType of params.schema.getImplementations(parentType).objects) {
              handleField(node, objectType)
            }
          }
        }

        return undefined
      },
    }
  }
}
