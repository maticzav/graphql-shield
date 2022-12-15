// copied from https://github.com/dimatill/graphql-middleware/blob/1c33515adb45da9a7358e03d56cd5edbf6918649/src/fragments.ts
import { InlineFragmentNode, Kind, OperationDefinitionNode, parse, print } from 'graphql'

export type FragmentReplacement = {
  field: string
  fragment: string
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

export function prepareFragmentReplacements(fragmentReplacements: FragmentReplacement[]) {
  return fragmentReplacements
    .filter((fragment) => Boolean(fragment))
    .map((fragmentReplacement) => {
      const fragment = parseFragmentToInlineFragment(fragmentReplacement.fragment)

      const newSelections = fragment.selectionSet.selections.filter((node) => {
        switch (node.kind) {
          case Kind.FIELD: {
            return node.name.value !== fragmentReplacement.field
          }
          default: {
            return true
          }
        }
      })

      if (newSelections.length === 0) {
        return null
      }

      const newFragment: InlineFragmentNode = {
        ...fragment,
        selectionSet: {
          kind: fragment.selectionSet.kind,
          loc: fragment.selectionSet.loc,
          selections: newSelections,
        },
      }

      const parsedFragment = print(newFragment)

      return {
        field: fragmentReplacement.field,
        fragment: parsedFragment,
      }
    })
    .filter((fr): fr is NonNullable<typeof fr> => fr !== null)
}
