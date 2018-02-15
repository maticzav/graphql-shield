<p align="center"><img src="https://imgur.com/DX1VKtn.png" width="150" /></p>

# graphql-shield
[![CircleCI](https://circleci.com/gh/maticzav/graphql-shield/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/graphql-shield/tree/master) [![npm version](https://badge.fury.io/js/graphql-shield.svg)](https://badge.fury.io/js/graphql-shield)

A GraphQL protector tool to keep your queries and mutations safe from intruders.

## Overview

- __Super Flexible:__ It supports everything GraphQL server does.
- __Super easy to use:__ Just add a wrapper function around your `resolvers` and you are ready to go!
- __Compatible:__ Works with all GraphQL Servers.
- __Super efficient:__ Caches results of previous queries to make your database more responsive.
- __Per-Type:__ Write permissions for your type specificly (check the example below).

## Install

```bash
npm install graphql-shield
```

## Usage

```js
const { GraphQLServer } = require('graphql-yoga')
const { shield } = require('../../../dist/src/index')

const verify = ctx => {
  const Authorization = ctx.request.get('Authorization')

  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    return token === 'supersecret'
  }
  return false
}

const users = [{
  id: '1',
  name: 'Mathew',
  secret: 'I love strawberies!'
}, {
  id: '2',
  name: 'Geroge',
  secret: 'I love tacos!'
}, {
  id: '3',
  name: 'Jack',
  secret: 'I love swimming!'
}]

const typeDefs = `
   type Query {
      hello: String!
      users: [User!]!
   }

   type User {
      id: String!
      name: String!
      secret: String!
   }
`

const resolvers = {
   Query: {
      hello: () => 'Hello world!',
      users: () => users
   },
}

const permissions = {
   Query: {
     hello: () => true,
    //  users: () => true (no need for this - we are blacklisting)
   },
   User: {
      secret: (_, args, ctx) => verify(ctx)
   }
}

const server = new GraphQLServer({
   typeDefs,
   resolvers: shield(resolvers, permissions, { debug: true }),
   context: req => ({
      ...req
   })
})

server.start(() => console.log('Server is running on http://localhost:4000'))
```

## API

#### `shield(resolvers, permissions, options?)`

##### `resolvers`
GraphQL resolvers.

#### `permissions`
A permission function must return a boolean.

```ts
type IPermission = (
  parent,
  args,
  ctx,
  info,
) => boolean | Promise<boolean>
```

- same arguments as for any GraphQL resolver.
- can be promise or synchronous function
- blacklisting permissions (you have to explicility prevent access)

```js
const auth = (parent, args, ctx, info) => {
  const userId = getUserId(ctx)
  if (userId) {
    return true
  }
  return false
}

const owner = async (parent, {id}, ctx: Context, info) => {
  const userId = getUserId(ctx)
  const exists = await ctx.db.exists.Post({
    id,
    author: {
      id: userId
    }
  })
  return exists
}

const permissions = {
  Query: {
    feed: auth,
    me: auth
  },
  Mutation: {
    createDraft: auth,
    publish: owner,
    deletePost: owner,
  },
}

const options = {
  debug: false,
  cache: true
}

export default shield(resolvers, permissions, options)
```

#### Options
Optionaly disable caching or use debug mode to find your bugs faster.

```ts
interface Options {
  debug: boolean
  cache: boolean
}
```

> `cache` is enabled by default.

## License

MIT