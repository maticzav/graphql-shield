<p align="center"><img src="https://imgur.com/DX1VKtn.png" width="100" /></p>

# graphql-shield
[![CircleCI](https://circleci.com/gh/maticzav/graphql-shield/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/graphql-shield/tree/master) [![npm version](https://badge.fury.io/js/graphql-shield.svg)](https://badge.fury.io/js/graphql-shield)

A GraphQL protector tool to keep your queries and mutations safe from intruders.

## Overview

- __Super Flexible:__ It supports everything GraphQL server does.
- __Super easy to use:__ Just add a wrapper function around your `resolvers` and you are ready to go!
- __Compatible:__ Works with all GraphQL Servers.

## Install

```bash
npm install graphql-shield
```

## Usage

```js
import { GraphQLServer } from 'graphql-yoga'
import shield from 'graphql-shield'

const typeDefs = `
  type Query {
    hello(name: String): String!
    secret(agent: String!, code: String!): String
  }
`

const resolvers = {
  Query: {
    hello: (_, { name }) => `Hello ${name || 'World'}`,
    secret: (_, { agent }) => `Hello agent ${name}`,
  },
}

const permissions = {
   Query: {
      hello: () => true,
      secret: (_, {code}) => code === 'donttellanyone'
   }
}

const server = new GraphQLServer({
   typeDefs,
   resolvers: shield(resolvers, permissions)
})
server.start(() => console.log('Server is running on http://localhost:4000'))
```

## API

#### `shield(resolvers, permissions)`

##### `resolvers`
GraphQL resolvers.

#### `permissions`
A permission function. 

- same parameters as for any GraphQL resolver.
- can be promise or synchronous function

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

export default shield(resolvers, permissions)
```

## License

MIT