// copied from https://github.com/ardatan/graphql-tools/blob/a233614ea5e76b855184c6d374e164904ff2ecb1/src/transforms/ReplaceFieldWithFragment.ts
// TODO: return it back to graphql-tools?
import {
  DocumentNode,
  GraphQLSchema,
  InlineFragmentNode,
  Kind,
  SelectionSetNode,
  TypeInfo,
  OperationDefinitionNode,
  parse,
  visit,
  visitWithTypeInfo,
  SelectionNode,
} from 'graphql'
import { Transform } from '@graphql-tools/delegate'
import { ExecutionRequest } from '@graphql-tools/utils'

type FieldToFragmentMapping = {
  [typeName: string]: { [fieldName: string]: Array<InlineFragmentNode> }
}

function deduplicateSelection(nodes: Array<SelectionNode>): Array<SelectionNode> {
  const selectionMap = nodes.reduce((map, node) => {
    switch (node.kind) {
      case 'Field': {
        if (node.alias != null) {
          if (node.alias.value in map) {
            return map
          }

          return {
            ...map,
            [node.alias.value]: node,
          }
        }

        if (node.name.value in map) {
          return map
        }

        return {
          ...map,
          [node.name.value]: node,
        }
      }
      case 'FragmentSpread': {
        if (node.name.value in map) {
          return map
        }

        return {
          ...map,
          [node.name.value]: node,
        }
      }
      case 'InlineFragment': {
        if (map.__fragment != null) {
          const fragment = map.__fragment as InlineFragmentNode

          const typeCondition = fragment.typeCondition

          if (!typeCondition) {
            throw new Error(`Fragment ${fragment} does not have a type condition`)
          }

          return {
            ...map,
            __fragment: concatInlineFragments(typeCondition.name.value, [fragment, node]),
          }
        }

        return {
          ...map,
          __fragment: node,
        }
      }
      default: {
        return map
      }
    }
  }, Object.create(null))

  const selection = Object.keys(selectionMap).reduce((selectionList, node) => selectionList.concat(selectionMap[node]), [])

  return selection
}

function concatInlineFragments(type: string, fragments: Array<InlineFragmentNode>): InlineFragmentNode {
  const fragmentSelections: Array<SelectionNode> = fragments.reduce<Array<SelectionNode>>(
    (selections, fragment) => selections.concat(fragment.selectionSet.selections),
    [],
  )

  const deduplicatedFragmentSelection: Array<SelectionNode> = deduplicateSelection(fragmentSelections)

  return {
    kind: Kind.INLINE_FRAGMENT,
    typeCondition: {
      kind: Kind.NAMED_TYPE,
      name: {
        kind: Kind.NAME,
        value: type,
      },
    },
    selectionSet: {
      kind: Kind.SELECTION_SET,
      selections: deduplicatedFragmentSelection,
    },
  }
}

export class ReplaceFieldWithFragment implements Transform {
  private targetSchema: GraphQLSchema | undefined

  private readonly mapping: FieldToFragmentMapping

  constructor(
    fragments: Array<{
      field: string
      fragment: string
    }>,
  ) {
    this.mapping = {}
    for (const { field, fragment } of fragments) {
      const parsedFragment = parseFragmentToInlineFragment(fragment)
      const typeCondition = parsedFragment.typeCondition

      if (!typeCondition) {
        throw new Error(`Fragment ${fragment} does not have a type condition`)
      }

      const actualTypeName = typeCondition.name.value

      if (!(actualTypeName in this.mapping)) {
        this.mapping[actualTypeName] = Object.create(null)
      }

      const typeMapping = this.mapping[actualTypeName]

      if (!(field in typeMapping)) {
        typeMapping[field] = [parsedFragment]
      } else {
        typeMapping[field].push(parsedFragment)
      }
    }
  }

  public transformSchema(originalSchema: GraphQLSchema): GraphQLSchema {
    this.targetSchema = originalSchema
    return originalSchema
  }

  public transformRequest(originalRequest: ExecutionRequest): ExecutionRequest {
    if (!this.targetSchema) {
      throw new Error(
        `The ReplaceFieldWithFragment transform's  "transformRequest" and "transformResult" methods cannot be used without first calling "transformSchema".`,
      )
    }
    const document = replaceFieldsWithFragments(this.targetSchema, originalRequest.document, this.mapping)
    return {
      ...originalRequest,
      document,
    }
  }
}

function replaceFieldsWithFragments(
  targetSchema: GraphQLSchema,
  document: DocumentNode,
  mapping: FieldToFragmentMapping,
): DocumentNode {
  const typeInfo = new TypeInfo(targetSchema)
  return visit(
    document,
    visitWithTypeInfo(typeInfo, {
      [Kind.SELECTION_SET](node: SelectionSetNode): SelectionSetNode | null | undefined {
        const parentType = typeInfo.getParentType()
        if (parentType != null) {
          const parentTypeName = parentType.name
          let selections = node.selections

          if (parentTypeName in mapping) {
            node.selections.forEach((selection) => {
              if (selection.kind === Kind.FIELD) {
                const name = selection.name.value
                const fragments = mapping[parentTypeName][name]
                if (fragments != null && fragments.length > 0) {
                  const fragment = concatInlineFragments(parentTypeName, fragments)
                  selections = selections.concat(fragment)
                }
              }
            })
          }

          if (selections !== node.selections) {
            return {
              ...node,
              selections: deduplicateSelection([...selections]),
            }
          }
        }

        return undefined
      },
    }),
  )
}

function parseFragmentToInlineFragment(definitions: string): InlineFragmentNode {
  if (definitions.trim().startsWith('fragment')) {
    const document = parse(definitions)
    for (const definition of document.definitions) {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        return {
          kind: Kind.INLINE_FRAGMENT,
          typeCondition: definition.typeCondition,
          selectionSet: definition.selectionSet,
        }
      }
    }
  }

  const query = parse(`{${definitions}}`).definitions[0] as OperationDefinitionNode
  for (const selection of query.selectionSet.selections) {
    if (selection.kind === Kind.INLINE_FRAGMENT) {
      return selection
    }
  }

  throw new Error('Could not parse fragment')
}
