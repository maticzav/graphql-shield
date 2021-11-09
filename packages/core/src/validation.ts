import {
  GraphQLResolveInfo,
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
import { RulesSchemaType } from './types'
import { ExhaustiveSwitchCheck } from './utils'

const DEFAULT_INSUFFICIENT_PERMISSIONS_ERROR = `Insufficient permissions for selection.`

/**
 * Returns a validation rule from GraphQL schema and rules that you may
 * include in the validation step of  GraphQL query execution cycle.
 */
export function getValidationRule<Context>(schema: GraphQLSchema, rules: RulesSchemaType): ValidationRule {
  // We cache the execution of the functions that allowed access to prevent duplicated
  // execution on the same context.
  const cache = new Set<string>()

  // Tells whether validation has completed to prevent unnecessary calculation.
  let completed = false

  return (context) => {
    const execctx: any = {}

    // Recursively executes the rules using given context.
    function evaluate<Context>(rule: Rule<any, any, Context>): void {
      // Make sure we still haven't finished executing.
      if (completed) {
        return
      }

      // Process the rules.
      switch (rule.kind) {
        case RuleKind.EXECUTION:
          return
        case RuleKind.ALLOW:
          return
        case RuleKind.DENY: {
          completed = true
          const error = new GraphQLError(DEFAULT_INSUFFICIENT_PERMISSIONS_ERROR, [node])
          context.reportError(error)
          return
        }
        case RuleKind.VALIDATION: {
          // Don't do anything if we've already calculated the result.
          if (cache.has(rule.uuid)) {
            return
          }

          const result = rule.resolver(execctx)
          if (result === true) {
            cache.add(rule.uuid)
          } else {
            completed = true
            const message =
              result instanceof ShieldAuthorizationError
                ? ShieldAuthorizationError.message
                : DEFAULT_INSUFFICIENT_PERMISSIONS_ERROR
            const error = new GraphQLError(message, [node])
            context.reportError(error)
          }
          return
        }
        // Operators
        case RuleKind.CHAIN:
        case RuleKind.AND: {
          // We evaluate each of the subrules. If none of the subrules
          // reported an error, then we don't have to report an error either
          // and if it did then it's in the global context already anyway.
          for (const subrule of rule.rules) {
            evaluate(subrule)
          }

          // Cache the success of the execution.
          cache.add(rule.uuid)
          return
        }

        case RuleKind.RACE:
        case RuleKind.OR: {
          for (const subrule of rule.rules) {
            const exec = evaluate(subrule)
            // At least one of the rules has to pass.
            if (exec === true) {
              cache.add(rule.uuid)
              return
            }
          }

          // Report an error if none of the rules passed.
          completed = true
          const error = new GraphQLError(DEFAULT_INSUFFICIENT_PERMISSIONS_ERROR, [node])
          context.reportError(error)
          return
        }

        default:
          throw new ExhaustiveSwitchCheck(rule)
      }
    }

    // Handles the validation of a single field.
    const handleField = (node: FieldNode, objectType: GraphQLObjectType) => {
      const type = objectType.name
      const field = node.name.value

      // Execute the validation rule.
      const rule = rules[type]?.[field]

      if (rule) {
        const executionContext = context
        context.reportError(new GraphQLError('', [node]))
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

          if (isObjectType(parentType)) {
            handleField(node, parentType)
          } else if (isUnionType(parentType)) {
            for (const objectType of parentType.getTypes()) {
              handleField(node, objectType)
            }
          } else if (isInterfaceType(parentType)) {
            const implementations = schema.getImplementations(parentType)
            for (const objectType of implementations.objects) {
              handleField(node, objectType)
            }
          }
        }

        return undefined
      },
    }
  }
}
