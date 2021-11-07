// codegen

import { Rule } from '.'
import { PartialDeep } from './utils'

/**
 * Object types contain information about all the objects our schema contains.
 */

/**
 * SchemaTypes includes all the types that we need to make reusable rules.
 */
export type SchemaType = {
  [path: string]: {
    parent: ObjectType
    args: ArgumentsType
  }
}

export type ObjectType = {
  [field: string]: any
}

export type ArgumentsType = {
  [arg: string]: any
}

/**
 * Rules schema lets us assign given rules to dedicated fields in the schema.
 */
export type RulesSchemaType = {
  [type: string]: {
    [field: string]: Rule
  }
} & { '*': Rule }

// MARK: - Experimenting

declare global {
  export interface Context {}
}

declare global {
  export interface GlobalSchema extends GeneratedSchema {}
}

// in shield:
declare global {
  export interface GlobalSchema {}
}

// Objects

type Query = {
  basket: string[]
}

// Schema

type GeneratedSchema = {
  'Query.user': {
    parent: Query
    args: { id: string; name: string }
  }
  'Query.group': {
    parent: Query
    args: { id: string }
  }
  'Query.me': {
    parent: Query
    args: {}
  }
  'Query.*':
    | GeneratedSchema['Query.me']
    | GeneratedSchema['Query.user']
    | GeneratedSchema['Query.group']
}

// Permissions

type GSch = {
  '*': GSch['Query']['*']
  Query: {
    '*': GSch['Query']['me'] | GSch['Query']['user'] | GSch['Query']['group']
    // All fields.
    me: Rule<
      GeneratedSchema['Query.me']['parent'],
      GeneratedSchema['Query.me']['args'],
      Context
    >
    user: Rule<
      GeneratedSchema['Query.user']['parent'],
      GeneratedSchema['Query.user']['args'],
      Context
    >
    group: Rule<
      GeneratedSchema['Query.group']['parent'],
      GeneratedSchema['Query.group']['args'],
      Context
    >
  }
}

function rule<T extends keyof GeneratedSchema>(
  fn: (
    parent: GeneratedSchema[T]['parent'],
    args: GeneratedSchema[T]['args'],
  ) => void,
) {}

rule<'Query.user' | 'Query.group'>((parent, { id }) => {
  parent.basket
})

const permissions: PartialDeep<GSch> = {
  Query: {},
}
