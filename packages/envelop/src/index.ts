/*
This file is heavily inspired by 
- https://github.com/dotansimha/envelop/blob/main/packages/plugins/operation-field-permissions/src/index.ts, and
- https://github.com/dotansimha/envelop/blob/main/packages/plugins/graphql-middleware/src/index.ts.

Consult these two files to understand better why this works the way it does.
*/

import { Plugin } from '@envelop/types'
import { shield, ShieldOptions } from '@shield/core'

const SHIELD_APPLIED_SYMBOL = Symbol('SCHEMA_WITH_SHIELD')

/**
 * Envelop plugin for GraphQL Shield.
 */
export function useShield(schema: any, options: ShieldOptions): Plugin {
  const { validate, wrapper } = shield(schema, options)

  return {
    onValidate({ context, addValidationRule }) {
      // We hook into the plugin system before validation runs, that's why we don't return anything.
      addValidationRule(validate)
    },
    onSchemaChange({ schema, replaceSchema }) {
      // Make sure we only apply GraphQL Shield to schema once.
      if (schema[SHIELD_APPLIED_SYMBOL]) {
        return
      }

      const shieldedSchema = wrapper(schema)
      shieldedSchema[SHIELD_APPLIED_SYMBOL] = true
      replaceSchema(shieldedSchema)
    },
  }
}
