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

## Example

```ts
import { GraphQLServer } from 'graphql-yoga'
import { rule, gqlShield, allow } from 'graphql-shield'

const typeDefs = `
  type Query {
    viewer: Viewer
    fruits: [Fruit!]!
  }

  type Fruit {
    name: String!
    count: Int!
  }

  type Viewer {
    cart: [Fruit!]!
  }
`

// Rules

@rule
async function isAuthenticated(parent, args, ctx, info) {
  return ctx.user !== null
}

// Permissions

const permissions = shield({
  Query: allow,
  Fruit: {
    name: allow,
    count: isAuthenticated
  }
  Viewer: isAuthenticated,
})

const server = GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions],
})

server.start(() => console.log('Server is running on localhost:4000'))
```

## License

MIT @ Matic Zavadlal
