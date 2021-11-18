import {
  FieldNode,
  getNamedType,
  GraphQLSchema,
  Kind,
  parse,
  TypeInfo,
  visit,
  SelectionNode,
  visitWithTypeInfo,
} from 'graphql'
import { Rule, RuleKind } from './rules'
import './types'
import { ExhaustiveSwitchCheck, PartialDeep } from './utils'

type ParseFunction = typeof parse

export const PARSING_COMPLETED_SYMBOL = Symbol('ShieldParsingComplete')

/**
 * Extends the query so that all the required fields have been requested.
 */
export function getParseFn<Context, T extends PartialDeep<GraphQLShield.GlobalRulesSchema<Context>>>(params: {
  rules: T
  parseFn: ParseFunction
  schema: GraphQLSchema
}): ParseFunction {
  const typeInfo = new TypeInfo(params.schema)

  return (source, options) => {
    const parsedDocumentNode = params.parseFn(source, options)

    // Read more about visitor pattern at https://graphql.org/graphql-js/language/#visit.
    const visitor = visitWithTypeInfo(typeInfo, {
      Field(field, key, parent, path, ancestors) {
        const fieldDef = typeInfo.getFieldDef()
        const typeName = getNamedType(fieldDef?.type)?.name

        // Leave the field early if we don't have type information.
        if (!typeName) {
          return false
        }

        /**
         * Check if any of the fields in the selection set contains
         * a rule that requires some other field.
         */
        const requiredFields = []

        for (const node of field.selectionSet?.selections ?? []) {
          switch (node.kind) {
            case Kind.FIELD: {
              const fieldName = field.name.value
              const rule =
                params.rules[typeName]?.[fieldName] ?? params.rules[typeName]?.['*'] ?? params.rules['*']

              const fields = getFields(rule)
              requiredFields.push(...fields)
              break
            }
            case Kind.FRAGMENT_SPREAD: {
              break
            }
            case Kind.INLINE_FRAGMENT: {
              break
            }
            default:
              throw new ExhaustiveSwitchCheck(node)
          }
        }

        if (requiredFields.length === 0) {
          // If there are no missing fields, just walk over this field.
          return false
        }

        const extendedSelectionSet: SelectionNode[] = [...(field.selectionSet?.selections ?? [])]
        for (const field of requiredFields) {
          extendedSelectionSet.push({
            kind: Kind.FIELD,
            name: {
              kind: Kind.NAME,
              value: field,
            },
          })
        }

        const extendedSelectionField: FieldNode = {
          ...field,
          selectionSet: {
            kind: Kind.SELECTION_SET,
            selections: extendedSelectionSet,
            loc: field.selectionSet?.loc,
          },
        }

        return extendedSelectionField
      },
    })

    const extendedDocumentNode = visit(parsedDocumentNode, visitor)
    return extendedDocumentNode
  }
}

/**
 * Returns required fields in a rule.
 */
function getFields(rule: Rule): string[] {
  switch (rule.kind) {
    case RuleKind.EXECUTION:
      return rule.fields
    case RuleKind.AND:
    case RuleKind.CHAIN:
    case RuleKind.OR:
    case RuleKind.RACE:
      return rule.rules.reduce<string[]>((acc, r) => [...acc, ...getFields(r)], [])
    case RuleKind.ALLOW:
    case RuleKind.DENY:
    case RuleKind.VALIDATION:
      return []
    default:
      throw new ExhaustiveSwitchCheck(rule)
  }
}
