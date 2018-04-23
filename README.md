<p align="center"><img src="https://imgur.com/DX1VKtn.png" width="150" /></p>

# graphql-shield

## API

```ts
import {
  GraphQLFieldResolver,
  GraphQLScalarType,
  GraphQLTypeResolver,
  GraphQLResolveInfo,
} from 'graphql'

export type IRuleFunction = (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => Promise<boolean>

export interface IRuleTypeMap {
  [key: string]: IRuleFunction | IRuleFieldMap
}

export interface IRuleFieldMap {
  [key: string]: IRuleFunction
}

export type IRules = IRuleFunction | IRuleTypeMap

export function rule(func: IRuleFunction): IRuleFunction

export function shield(rules: IRules): IMiddleware
```
