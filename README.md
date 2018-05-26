<p align="center"><img src="https://imgur.com/DX1VKtn.png" width="150" /></p>

# graphql-shield

[![CircleCI](https://circleci.com/gh/maticzav/graphql-shield/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/graphql-shield/tree/master) [![npm version](https://badge.fury.io/js/graphql-shield.svg)](https://badge.fury.io/js/graphql-shield)
[![Backers on Open Collective](https://opencollective.com/graphql-shield/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/graphql-shield/sponsors/badge.svg)](#sponsors)

> GraphQL Server permissions as another layer of abstraction!

## Overview

GraphQL Shield helps you create permission layer for your application. Using intuitive rule-API, you'll gain the power of shield engine on every request and reduce the load time of every request with smart caching. This way you can make sure your application will remain quick, and no internal data will be exposed.

[![Sponsored By GraphCMS](https://github.com/maticzav/graphql-shield/raw/master/media/graphcms.svg?sanitize=true)](https://graphcms.com/?ref=maticzav)

## Features

* ✂️ **Super Flexible:** Based on [GraphQL Middleware](https://github.com/prismagraphql/graphql-middleware).
* 😌 **Super easy to use:** Just add permissions to your [Yoga](https://github.com/prismagraphql/graphql-yoga) `middlewares` set, and you are ready to go!
* 🤝 **Compatible:** Works with all GraphQL Servers.
* 🚀 **Blazing fast:** Intelligent V8 Shield engine caches all your request to prevent anything from being called too many times.
* 🎯 **Per-Type:** Write permissions for your schema, types or specific fields (check the example below).
* 💯 **Tested:** Very well [tested](https://github.com/maticzav/graphql-shield/tree/master/tests) functionalities!

## Install

```bash
yarn add graphql-shield
```

## Example

```ts
import { GraphQLServer } from 'graphql-yoga'
import { rule, shield, and, or, not } from 'graphql-shield'

const typeDefs = `
  type Query {
    frontPage: [Fruit!]!
    fruits: [Fruit!]!
    cusomers: [Customer!]!
  }

  type Mutation {
    addFruitToBasket: Boolean!
  }

  type Fruit {
    name: String!
    count: Int!
  }

  type Customer {
    id: ID!
    basket: [Fruit!]!
  }
`

// Rules

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
  return ctx.user !== null
})

const isAdmin = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'admin'
})

const isEditor = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'editor'
})


// Permissions

const permissions = shield({
  Query: {
    frontPage: not(isAuthenticated),
    fruits: and(isAuthenticated, or(isAdmin, isEditor)),
    customers: and(isAuthenticated, isAdmin)
  },
  Mutation: {
    addFruitToBasket: isAuthenticated,
  },
  Fruit: isAuthenticated,
  Cusomer: isAdmin
})

const server = GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions],
})

server.start(() => console.log('Server is running on http://localhost:4000'))
```

## API

### Types

```ts
// Rule
function rule(name?: string, options?: IRuleOptions)(func: IRuleFunction): Rule

type IRuleFunction = (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
) => Promise<boolean>

export interface IRuleOptions {
  cache?: boolean
}

// Logic
function and(...rules: IRule[]): LogicRule
function or(...rules: IRule[]): LogicRule
function not(rule: IRule): LogicRule

// Predefined rules
const allow: Rule
const deny: Rule

type IRule = Rule | LogicRule

interface IRuleFieldMap {
  [key: string]: IRule
}

interface IRuleTypeMap {
  [key: string]: IRule | IRuleFieldMap
}

type IRules = IRule | IRuleTypeMap

function shield(rules?: IRules, options?: IOptions): IMiddleware

export interface IOptions {
  debug?: boolean
}
```

### `shield(rules?, options?)`

> Generates GraphQL Middleware layer from your rules.

#### `rules`

A rule map must match your schema definition. All rules must be created using `rule` function to ensure caches are made correctly. You can apply your `rule` accross entire schema, Type scoped, or field specific.

##### Limitations

* All rules must have a distinct name. Usually, you won't have to care about this as all names are by default automatically generated to prevent such problems. In case your function needs additional variables from other parts of the code and is defined as a function, you'll set a specific name to your rule to avoid name generation.

```jsx
// Normal
const admin = rule({ cache: true })(async (parent, args, ctx, info) => true)

// With external data
const admin = bool =>
  rule(`name`, { cache: true })(async (parent, args, ctx, info) => bool)
```

* Cache is enabled by default accross all rules. To prevent `cache` generation, set `{ cache: false }` when generating a rule.
* By default, no rule is executed more than once in complete query execution. This accounts for significantly better load times and quick responses.

#### `options`

| Property | Required | Default | Description                                 |
| -------- | -------- | ------- | ------------------------------------------- |
| debug    | false    | true    | Toggles catching internal resolvers errors. |

By default `shield` ensures no internal data is exposed to client if it was not meant to be. Therfore, all thrown errors during execution resolve in `Not Authenticated!` error message if not otherwise specified using `CustomError`. This can be turned off by setting `debug` option to true.

### `allow`, `deny`

> GraphQL Shield predefined rules.

`allow` and `deny` rules do exactly what their names describe.

### `and`, `or`, `not`

> `and`, `or` and `not` allow you to nest rules in logic operations.

* Nested rules fail by default if error is thrown.

#### And Rule

`And` rule allows access only if all sub rules used return `true`.

#### Or Rule

`Or` rule allows access if at least one sub rule returns `true` and no rule throws an error.

#### Not

`Not` works as usual not in code works.

```tsx
import { shield, rule, and, or } from 'graphql-shield'

const isAdmin = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'admin'
})

const isEditor = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'editor'
})

const isOwner = rule()(async (parent, args, ctx, info) => {
  return ctx.user.items.some(id => id === parent.id)
})

const permissions = shield({
  Query: {
    users: or(isAdmin, isEditor)
  },
  Mutation: {
    createBlogPost: or(isAdmin, and(isOwner, isEditor))
  }
  User: {
    secret: isOwner
  },
})
```

### `Custom Errors`

Shield, by default, catches all errors thrown durign resolver execution. This way we can be 100% sure none of your internal logic will be exposed to the client if it was not meant to be.

Nevertheless, you can use `CustomError` error types to report your custom error messages to your users.

```tsx
import { CustomError } from 'graphql-shield`

const typeDefs = `
  type Query {
    customError: String!
  }
`

const resolvers = {
  Query: {
    customError: () => {
      throw new CustomError('customErrorResolver')
    },
  }
}

const permissions = shield()

const server = GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions]
})
```

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="https://github.com/maticzav/graphql-shield/graphs/contributors"><img src="https://opencollective.com/graphql-shield/contributors.svg?width=890&button=false" /></a>

## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/graphql-shield#backer)]

<a href="https://opencollective.com/graphql-shield#backers" target="_blank"><img src="https://opencollective.com/graphql-shield/backers.svg?width=890"></a>

## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/graphql-shield#sponsor)]

<a href="https://opencollective.com/graphql-shield/sponsor/0/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/1/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/2/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/3/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/4/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/5/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/6/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/7/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/8/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/graphql-shield/sponsor/9/website" target="_blank"><img src="https://opencollective.com/graphql-shield/sponsor/9/avatar.svg"></a>

## Contributing

We are always looking for people to help us grow `graphql-shield`! If you have an issue, feature request, or pull request, let us know!

## License

MIT @ Matic Zavadlal
