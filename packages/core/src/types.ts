import { Rule } from './rules'

/**
 * Object types contain information about all the objects our schema contains.
 */

declare global {
  export namespace GraphQLShield {
    /**
     * Rules schema lets us assign given rules to dedicated fields in the schema.
     */
    export interface GlobalRulesSchema<Context> {
      [type: string]:
        | {
            [field: string]: Rule<any, any, Context>
          }
        | Rule<null, any, Context>
    }

    /**
     * Outlines the fields and arguments of the schema.
     */
    export interface GlobalFieldsSchema {
      [path: string]: {
        parent: ObjectType
        args: ArgumentsType
        return: any
      }
    }

    type ObjectType = {
      [field: string]: any
    }

    type ArgumentsType = {
      [arg: string]: any
    }
  }
}
