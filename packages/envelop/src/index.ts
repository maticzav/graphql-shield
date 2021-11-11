/*
This file is heavily inspired by 
- https://github.com/dotansimha/envelop/blob/main/packages/plugins/operation-field-permissions/src/index.ts,
- https://github.com/dotansimha/envelop/blob/6d872a733608de5a4d8d7026ffee9c299e01a523/packages/plugins/extended-validation/src/plugin.ts#L40, and
- https://github.com/dotansimha/envelop/blob/main/packages/plugins/graphql-middleware/src/index.ts.

Consult these two files to understand better why this works the way it does.
*/

import { Plugin } from '@envelop/types'
import * as shield from '@shield/core'
import { visitWithTypeInfo } from 'graphql'
import { ExecutionResult, GraphQLError, TypeInfo, ValidationContext, visit, visitInParallel } from 'graphql'

const SHIELD_APPLIED_SYMBOL = Symbol('SCHEMA_WITH_SHIELD')

// TODO: Allow multiple shield instances.

export type ShieldOptions = {}

/**
 * Envelop plugin for GraphQL Shield.
 */

export function useShield<T extends shield.PartialDeep<GraphQLShield.GlobalRulesSchema<Context>>, Context>(
  rules: T,
  options: ShieldOptions,
): Plugin<Context> {
  let schemaTypeInfo: TypeInfo

  const schemaMapper = shield.getSchemaMapper<T, Context>(rules)

  return {
    onSchemaChange({ schema, replaceSchema }) {
      schemaTypeInfo = new TypeInfo(schema)

      // Make sure we only apply GraphQL Shield to schema once.
      if (schema[SHIELD_APPLIED_SYMBOL]) {
        return
      }

      const shieldedSchema = schemaMapper(schema)
      shieldedSchema[SHIELD_APPLIED_SYMBOL] = true
      replaceSchema(shieldedSchema)
    },
    onExecute({ args, setResultAndStopExecution }) {
      // We hook into the execution cycle before execution which is the same as running the
      // validation after validation cycle. This way, we can access execution context.
      const errors: GraphQLError[] = []
      const typeInfo = schemaTypeInfo || new TypeInfo(args.schema)
      const validationContext = new ValidationContext(args.schema, args.document, typeInfo, (e) => {
        errors.push(e)
      })

      const validationRule = shield.getValidationRule<T, Context>({
        rules,
        context: args.contextValue,
        schema: args.schema,
      })

      const visitor = visitInParallel([validationRule(validationContext)])
      visit(args.document, visitWithTypeInfo(typeInfo, visitor))

      if (errors.length > 0) {
        let result: ExecutionResult = {
          data: null,
          errors,
        }
        return setResultAndStopExecution(result)
      }
    },
  }
}

export { allow, and, chain, deny, error, execution, input, or, race, validation } from '@shield/core'
