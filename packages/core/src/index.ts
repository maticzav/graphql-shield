import * as tools from '@graphql-tools/utils'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'

// codegen
type GeneratedSchema = {
  'Query.user': {}
  'Query.*': {}
  'User.id': {}
}

declare global {
  export interface GlobalSchema extends GeneratedSchema {}
}

// in shield:
declare global {
  export interface GlobalSchema {}
}

export type ShieldOptions = {
  debug: boolean
  allowExternalErrors: boolean
  fallbackError?: IFallbackErrorType
}

/**
 * Returns functions that you should bind to specific execution layers.
 */
export function shield<Context, Schema extends GlobalSchema = GlobalSchema>(
  schema: Schema,
  options: ShieldOptions,
) {
  // Parse schema
  const validationRules = extractValidationRules(schema)
  const executionRules = extractExecutionRules(schema)

  // Generate validator function
  const validatorFn = getValidationFunction(validationRules)
  const wrappingFunctions = getWrappingFunctions(executionRules)

  return {
    validate: (ctx: Context) => {},
    wrapSchema: (schema: GraphQLSchema): GraphQLSchema => {
      return tools.mapSchema(schema, {
        [tools.MapperKind.FIELD]: (field, fieldName, typeName) => {
          // Ignore input types.
          if (!('resolve' in field)) {
            return field
          }

          // Compose resolver on regular fields.
          field.resolve = fieldCompositions[fieldName](field.resolve)

          return field
        },
      })
    },
  }
}

// Generated Schema

type Context = {
  token: string
}

type Args = {
  Query: {
    me: {
      id: string
    }
  }
}

type Query = {
  me: Me
  basket: string[]
}

type Me = {
  name: string
}

type GSch = {
  '*': GSch['Query']['*'] | GSch['Mutation']['*']
  Query: {
    '*': GSch['Query']['me'] | GSch['Query']['basket']
    // All fields.
    me: Rule<Query, Args['Query']['me'], Context>
    basket: Rule
  }
  Mutation: {
    '*': Rule
  }
  Me: {
    '*': GSch['Me']['name']
    name: Rule
  }
}

// Types

type Schema<Types extends string[] = any> = {
  [type in Types[number]]: {}
}

const schema: GSch = {
  Query: {
    me: execution((parent, args) => {
      return false
    }),
  },
}

// Rules

//
