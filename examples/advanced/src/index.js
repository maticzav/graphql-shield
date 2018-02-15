const { GraphQLServer } = require('graphql-yoga')
const { shield } = require('graphql-shield')

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
   User: {
      id: () => true,
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