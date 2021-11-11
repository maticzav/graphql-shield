import * as shield from './'
import { Rule } from './rules'

// codegen
declare global {
  export namespace GraphQLShield {
    type Query = {
      basket: string[]
    }

    export interface GeneratedFieldsSchema {
      'Query.user': {
        parent: Query
        args: { id: string; name: string }
        return: any
      }
      'Query.group': {
        parent: Query
        args: { id: string }
        return: any
      }
      'Query.me': {
        parent: Query
        args: {}
        return: any
      }
      'Query.*':
        | GeneratedFieldsSchema['Query.me']
        | GeneratedFieldsSchema['Query.user']
        | GeneratedFieldsSchema['Query.group']
    }

    export interface GlobalFieldsSchema extends GeneratedFieldsSchema {}

    interface GeneratedRulesSchema<Context> {
      Query: {
        '*':
          | GeneratedRulesSchema<Context>['Query']['me']
          | GeneratedRulesSchema<Context>['Query']['user']
          | GeneratedRulesSchema<Context>['Query']['group']
        // All fields.
        me: Rule<GlobalFieldsSchema['Query.me']['parent'], GlobalFieldsSchema['Query.me']['args'], Context>
        user: Rule<
          GlobalFieldsSchema['Query.user']['parent'],
          GlobalFieldsSchema['Query.user']['args'],
          Context
        >
        group: Rule<
          GlobalFieldsSchema['Query.group']['parent'],
          GlobalFieldsSchema['Query.group']['args'],
          Context
        >
      }
    }

    export interface GlobalRulesSchema<Context> extends GeneratedRulesSchema<Context> {}
  }
}

type Context = {}

shield.execution<'', Context>(async () => {
  return false
})

let foo: GraphQLShield.GlobalFieldsSchema['']
const name: keyof GraphQLShield.GlobalFieldsSchema = ''
