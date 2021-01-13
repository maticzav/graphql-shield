<p align="center"><img src="https://imgur.com/DX1VKtn.png" width="150" /></p>

# graphql-shield

[![CircleCI](https://circleci.com/gh/maticzav/graphql-shield/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/graphql-shield/tree/master)
[![codecov](https://codecov.io/gh/maticzav/graphql-shield/branch/master/graph/badge.svg)](https://codecov.io/gh/maticzav/graphql-shield)
[![npm version](https://badge.fury.io/js/graphql-shield.svg)](https://badge.fury.io/js/graphql-shield)
[![Backers on Open Collective](https://opencollective.com/graphql-shield/backers/badge.svg)](#backers)[![Sponsors on Open Collective](https://opencollective.com/graphql-shield/sponsors/badge.svg)](#sponsors)

> GraphQL Server permissions as another layer of abstraction!

## Overview

GraphQL Shield helps you create a permission layer for your application. Using an intuitive rule-API, you'll gain the power of the shield engine on every request and reduce the load time of every request with smart caching. This way you can make sure your application will remain quick, and no internal data will be exposed.

Try building a groceries shop to better understand the benefits of GraphQL Shield! [Banana &Co.](https://medium.com/@maticzavadlal/graphql-shield-9d1e02520e35) 🍏🍌🍓.

Explore common receipts and learn about advanced GraphQL! [GraphQL Shield 3.0](https://medium.com/@maticzavadlal/graphql-shield-9d1e02520e35) ⚔️🛡🐴.

[![Sponsored By LabelSync](https://github.com/maticzav/graphql-shield/raw/master/media/labelsync.png)](https://label-sync.com)

## Features

- ✂️ **Flexible:** Based on [GraphQL Middleware](https://github.com/prismagraphql/graphql-middleware).
- 😌 **Easy to use:** Just add permissions to your [Yoga](https://github.com/prismagraphql/graphql-yoga) `middlewares` set, and you are ready to go!
- 🤝 **Compatible:** Works with all GraphQL Servers.
- 🚀 **Smart:** Intelligent V8 Shield engine caches all your request to prevent any unnecessary load.
- 🎯 **Per-Type or Per-Field:** Write permissions for your schema, types or specific fields (check the example below).

## Install

```bash
yarn add graphql-shield
```

## Example

### GraphQL Yoga

```ts
import { GraphQLServer } from 'graphql-yoga'
import { ContextParameters } from 'graphql-yoga/dist/types'
import { rule, shield, and, or, not } from 'graphql-shield'

const typeDefs = `
  type Query {
    frontPage: [Fruit!]!
    fruits: [Fruit!]!
    customers: [Customer!]!
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

const resolvers = {
  Query: {
    frontPage: () => [
      { name: 'orange', count: 10 },
      { name: 'apple', count: 1 },
    ],
  },
}

// Auth

const users = {
  mathew: {
    id: 1,
    name: 'Mathew',
    role: 'admin',
  },
  george: {
    id: 2,
    name: 'George',
    role: 'editor',
  },
  johnny: {
    id: 3,
    name: 'Johnny',
    role: 'customer',
  },
}

function getUser(ctx: ContextParameters) {
  const auth = ctx.request.get('Authorization')
  if (users[auth]) {
    return users[auth]
  } else {
    return null
  }
}

// Rules

/* Read more about cache options down in the `rules/cache` section. */

const isAuthenticated = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user !== null
  },
)

const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user.role === 'admin'
  },
)

const isEditor = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user.role === 'editor'
  },
)

// Permissions

const permissions = shield({
  Query: {
    frontPage: not(isAuthenticated),
    fruits: and(isAuthenticated, or(isAdmin, isEditor)),
    customers: and(isAuthenticated, isAdmin),
  },
  Mutation: {
    addFruitToBasket: isAuthenticated,
  },
  Fruit: isAuthenticated,
  Customer: isAdmin,
})

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions],
  context: (req) => ({
    ...req,
    user: getUser(req),
  }),
})

server.start(() => console.log('Server is running on http://localhost:4000'))
```

### Others, using `graphql-middleware`

```ts
// Permissions...

// Apply permissions middleware with applyMiddleware
// Giving any schema (instance of GraphQLSchema)

import { applyMiddleware } from 'graphql-middleware'
// schema definition...
schema = applyMiddleware(schema, permissions)
```

## API

### Types

```ts
/* Rule */
function rule(
  name?: string,
  options?: IRuleOptions,
): (func: IRuleFunction) => Rule

type IFragment = string
type ICacheOptions = 'strict' | 'contextual' | 'no_cache' | boolean
type IRuleResult = boolean | string | Error

type IRuleFunction = (
  parent?: any,
  args?: any,
  context?: any,
  info?: GraphQLResolveInfo,
) => IRuleResult | Promise<IRuleResult>

interface IRuleOptions {
  cache?: ICacheOptions
  fragment?: IFragment
}

/* Input */
function inputRule(name?: string): (yup: Yup => Yup.Schema, context: any) => Rule

/* Logic */
function and(...rules: IRule[]): LogicRule
function chain(...rules: IRule[]): LogicRule
function or(...rules: IRule[]): LogicRule
function race(...rules: IRule[]): LogicRule
function not(rule: IRule, error?: string | Error): LogicRule
const allow: LogicRule
const deny: LogicRule

import { GraphQLResolveInfo } from 'graphql'
import { IMiddlewareGenerator } from 'graphql-middleware'

// Rule

export type IFragment = string
export type ICache = 'strict' | 'contextual' | 'no_cache'
export type IRuleResult = boolean | string | Error
export type IRuleFunction = (
  parent?: any,
  args?: any,
  context?: any,
  info?: GraphQLResolveInfo,
) => IRuleResult | Promise<IRuleResult>

// Rule Constructor Options

type ICacheOptions = 'strict' | 'contextual' | 'no_cache' | boolean

interface IRuleOptions {
  cache?: ICacheOptions
  fragment?: IFragment
}

// Rules Definition Tree

export type ShieldRule = IRule | ILogicRule

interface IRuleFieldMap {
  [key: string]: ShieldRule
}

interface IRuleTypeMap {
  [key: string]: ShieldRule | IRuleFieldMap
}

type IRules = ShieldRule | IRuleTypeMap

type IHashFunction = (arg: { parent: any; args: any }) => string

type IFallbackErrorMapperType = (
  err: unknown,
  parent: object,
  args: object,
  ctx: IShieldContext,
  info: GraphQLResolveInfo,
) => Promise<Error> | Error

export type IFallbackErrorType = Error | IFallbackErrorMapperType

// Generator Options

interface IOptions {
  debug?: boolean
  allowExternalErrors?: boolean
  fallbackRule?: ShieldRule
  fallbackError?: string | IFallbackErrorType
  hashFunction?: IHashFunction
}

declare function shield(
  ruleTree: IRules,
  options: IOptions,
): IMiddlewareGenerator
```

### `shield(rules?, options?)`

> Generates GraphQL Middleware layer from your rules.

#### `rules`

A rule map must match your schema definition. All rules must be created using the `rule` function to ensure caches are made correctly. You can apply your `rule` across entire schema, Type scoped, or field specific.

##### Limitations

- All rules must have a distinct name. Usually, you won't have to care about this as all names are by default automatically generated to prevent such problems. In case your function needs additional variables from other parts of the code and is defined as a function, you'll set a specific name to your rule to avoid name generation.

```jsx
// Normal
const admin = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => true,
)

// With external data
const admin = (bool) =>
  rule(`name-${bool}`, { cache: 'contextual' })(
    async (parent, args, ctx, info) => bool,
  )
```

- Cache is disabled by default. To enable `cache` generation, set cache option when generating a rule.

##### Cache

You can choose from three different cache options.

1.  `no_cache` - prevents rules from being cached.
1.  `contextual` - use when rule only relies on `context` parameter (useful for authentication).
1.  `strict` - use when rule relies on `parent` or `args` parameter as well (field specific modifications).

```ts
// Contextual
const isAdmin = rule({ cache: 'contextual' })(
  async (parent, args, ctx, info) => {
    return ctx.user.isAdmin
  },
)

// Strict
const canSeeUserSensitiveData = rule({ cache: 'strict' })(
  async (parent, args, ctx, info) => {
    /* The id of observed User matches the id of authenticated viewer. */
    return ctx.viewer.id === parent.id
  },
)

// No-cache (default)
const admin = rule({ cache: 'no_cache' })(async (parent, args, ctx, info) => {
  return ctx.user.isAdmin || args.code === 'secret' || parent.id === 'theone'
})
```

> Backward compatibility: `{ cache: false }` converts to `no_cache`, and `{ cache: true }` converts to `strict`.

##### Custom Errors

Shield, by default, catches all errors thrown during resolver execution. This way we can be 100% sure none of your internal logic can be exposed to the client if it was not meant to be.

To return custom error messages to your client, you can return error instead of throwing it. This way, Shield knows it's not a bug but rather a design decision under control. Besides returning an error you can also return a `string` representing a custom error message.

You can return custom error from resolver or from rule itself. Rules that return error are treated as failing, therefore not processing any further resolvers.

```tsx
const typeDefs = `
  type Query {
    customErrorInResolver: String
    customErrorInRule: String
  }
`

const resolvers = {
  Query: {
    customErrorInResolver: () => {
      return new Error('Custom error message from resolver.')
    },
    customErrorMessageInRule: () => {
      // Querying is stopped because rule returns an error
      console.log("This won't be logged.")
      return "you won't see me!"
    },
    customErrorInRule: () => {
      // Querying is stopped because rule returns an error
      console.log("This won't be logged.")
      return "you won't see me!"
    },
  },
}

const ruleWithCustomError = rule()(async (parent, args, ctx, info) => {
  return new Error('Custom error from rule.')
})

const ruleWithCustomErrorMessage = rule()(async (parent, args, ctx, info) => {
  return 'Custom error message from rule.'
})

const permissions = shield({
  Query: {
    customErrorInRule: ruleWithCustomError,
    customErrorMessageInRule: ruleWithCustomErrorMessage,
  },
})

const server = GraphQLServer({
  typeDefs,
  resolvers,
  middlewares: [permissions],
})
```

> Errors thrown in resolvers can be tracked using `debug` option. This way Shield ensures your code is production ready at all times.

> If you wish to see errors thrown inside resolvers, you can set `allowExternalErrors` option to `true`. This way, Shield won't hide custom errors thrown during query resolving.

#### `options`

| Property            | Required | Default                                              | Description                                        |
| ------------------- | -------- | ---------------------------------------------------- | -------------------------------------------------- |
| allowExternalErrors | false    | false                                                | Toggle catching internal errors.                   |
| debug               | false    | false                                                | Toggle debug mode.                                 |
| fallbackRule        | false    | allow                                                | The default rule for every "rule-undefined" field. |
| fallbackError       | false    | Error('Not Authorised!')                             | Error Permission system fallbacks to.              |
| hashFunction        | false    | [object-hash](https://github.com/puleos/object-hash) | Hashing function to use for `strict` cache         |

By default `shield` ensures no internal data is exposed to client if it was not meant to be. Therefore, all thrown errors during execution resolve in `Not Authorised!` error message if not otherwise specified using `error` wrapper. This can be turned off by setting `allowExternalErrors` option to true.

### Per Type Wildcard Rule

There is an option to specify a rule that will be applied to all fields of a type (`Query`, `Mutation`, ...) that do not specify a rule.
It is similar to the `options.fallbackRule` but allows you to specify a `fallbackRule` per type.

```ts
// this will only allow query1 and query2.
// query3 for instance will be denied
// it will also deny every mutation
// (you can still use `fallbackRule` option with it)
const permissions = shield({
  Query: {
    "*": deny
    query1: allow,
    query2: allow,
  },
  Mutation: {
    "*": deny
  },
}, {
  fallbackRule: allow
})
```

### Basic rules

> `allow`, `deny` are GraphQL Shield predefined rules.

`allow` and `deny` rules do exactly what their names describe.

### Rules on Input Types or Arguments

> Validate arguments using [Yup](https://github.com/jquense/yup).

```ts
function inputRule(name?: string)((yup: Yup, ctx: any) => Yup.Schema, options?: Yup.ValidationOptions): Rule
```

Input rule works exactly as any other rule would work. Instead of providing a complex validation rule you can simply provide a Yup validation schema which will be mached against provided arguments.
This can be especially useful when limiting optional fields such as `create` and `connect` with Prisma, for example.

**Example:**

```graphql
type Mutation {
  login(email: String): LoginPayload
}
```

Note that Yup receives entire `args` object, therefore, you should start composing schema with an object.

```ts
const isEmailEmail = inputRule()(
  (yup) =>
    yup.object({
      email: yup.string().email('It has to be an email!').required(),
    }),
  {
    abortEarly: false,
  },
)
```

### Logic Rules

#### `and`, `or`, `not`, `chain`, `race`

> `and`, `or` and `not` allow you to nest rules in logic operations.

##### `and` rule

`and` rule allows access only if all sub rules used return `true`.

##### `chain` rule

`chain` rule allows you to chain the rules, meaning that rules won't be executed all at once, but one by one until one fails or all pass.

> The left-most rule is executed first.

##### `or` rule

`or` rule allows access if at least one sub rule returns `true` and no rule throws an error.

##### `race` rule

`race` rule allows you to chain the rules so that execution stops once one of them returns `true`.

##### not

`not` works as usual not in code works.

> You may also add a custom error message as the second parameter `not(rule, error)`.

```tsx
import { shield, rule, and, or } from 'graphql-shield'

const isAdmin = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'admin'
})

const isEditor = rule()(async (parent, args, ctx, info) => {
  return ctx.user.role === 'editor'
})

const isOwner = rule()(async (parent, args, ctx, info) => {
  return ctx.user.items.some((id) => id === parent.id)
})

const permissions = shield({
  Query: {
    users: or(isAdmin, isEditor),
  },
  Mutation: {
    createBlogPost: or(isAdmin, and(isOwner, isEditor)),
  },
  User: {
    secret: isOwner,
  },
})
```

### Global Fallback Error

GraphQL Shield allows you to set a globally defined fallback error that is used instead of `Not Authorised!` default response. This might be particularly useful for localization. You can use `string` or even custom `Error` to define it.

```ts
const permissions = shield(
  {
    Query: {
      items: allow,
    },
  },
  {
    fallbackError: 'To je napaka!', // meaning "This is a mistake" in Slovene.
  },
)

const permissions = shield(
  {
    Query: {
      items: allow,
    },
  },
  {
    fallbackError: new CustomError('You are something special!'),
  },
)

const permissions = shield(
  {
    Query: {
      items: allow,
    },
  },
  {
    fallbackError: async (thrownThing, parent, args, context, info) => {
      if (thrownThing instanceof ApolloError) {
        // expected errors
        return thrownThing
      } else if (thrownThing instanceof Error) {
        // unexpected errors
        console.error(thrownThing)
        await Sentry.report(thrownThing)
        return new ApolloError('Internal server error', 'ERR_INTERNAL_SERVER')
      } else {
        // what the hell got thrown
        console.error('The resolver threw something that is not an error.')
        console.error(thrownThing)
        return new ApolloError('Internal server error', 'ERR_INTERNAL_SERVER')
      }
    },
  },
)
```

### Fragments

Fragments allow you to define which fields your rule requires to work correctly. This comes in extremely handy when your rules rely on data from database. You can use fragments to define which data your rule relies on.

```ts
const isItemOwner = rule({
  cache: 'strict',
  fragment: 'fragment ItemID on Item { id }',
})(async ({ id }, args, ctx, info) => {
  return ctx.db.exists.Item({
    id,
    owner: { id: ctx.user.id },
  })
})

const permissions = shield(
  {
    Query: {
      items: allow,
    },
    Item: {
      id: allow,
      name: allow,
      secret: isItemOwner,
    },
  },
  {
    fallbackRule: deny,
  },
)

// GraphQL Yoga

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  middlewares: [permissions],
  context: ({
    request,
    response,
    fragmentReplacements: middlewareFragmentReplacements,
  }) => {
    return {
      request,
      response,
      db: new Prisma({
        fragmentReplacements: [
          ...middlewareFragmentReplacements,
          ...resolverFragmentReplacements,
        ],
        endpoint: process.env.PRISMA_ENDPOINT,
        secret: process.env.PRISMA_SECRET,
        debug: true,
      }),
    }
  },
})

// GraphQL Middleware

const { schema, fragmentReplacements } = applyMiddleware(schema, permissions)
```

### Whitelisting vs Blacklisting

> Whitelisting/Blacklisting is no longer available in versions after `3.x.x`, and has been replaced in favor of `fallbackRule`.

Shield allows you to lock-in your schema. This way, you can seamlessly develop and publish your work without worrying about exposing your data. To lock in your service simply set `fallbackRule` to `deny` like this;

```ts
const typeDefs = `
  type Query {
    users: [User!]!
    newFeatures: FeaturesConnection!
  }

  type User {
    id: ID!
    name: String!
    author: Author!
  }

  type Author {
    id: ID!
    name: String!
    secret: String
  }
`

const permissions = shield(
  {
    Query: {
      users: allow,
    },
    User: allow,
    Author: {
      id: allow,
      name: allow,
    },
  },
  { fallbackRule: deny },
)
```

> You can achieve same functionality by setting every "rule-undefined" field to `deny` the request.

## Troubleshooting

#### When a single field is "Not Authorised!" the entire parent object returns null.

This occurs when a non-nullable field (specified in the schema) returns a null value (due to GraphQL Shield blocking the field's value). GraphQL is a strongly typed language - the schema serves as a contract between client and server - which requires that the server response follow the schema definition.

See [#126](https://github.com/maticzav/graphql-shield/issues/126#issuecomment-416524581) and [#97](https://github.com/maticzav/graphql-shield/issues/97#issuecomment-404867307) for more detailed explanations.

#### A rule is executed only once even though the dataset contains multiple values (and thus should execute the rule multiple times)

This occurs because of caching. When the cache is set to `contextual` only the contextual variable of the rule is expected to be evaluated. Setting the cache to `strict` allows the rule to rely on parent and args parameters as well, while setting the cache to `no_cache` won't cache result at all.

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](https://github.com/maticzav/graphql-shield/graphs/contributors)].
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
