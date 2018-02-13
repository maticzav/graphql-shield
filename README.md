# graphql-shield

A GraphQL protector tool to keep your queries and mutations from intruders.

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
server.start(() => console.log('Server is running on localhost:4000'))
```
