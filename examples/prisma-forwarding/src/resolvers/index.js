const { shield } = require('graphql-shield')
const { verify } = require('../auth.js')
const { Query } = require('./Query')
const { Mutation } = require('./Mutation')

const auth = (_, args, ctx, info) => verify(ctx)

const resolvers = {
  Query,
  Mutation
}

const permissions = {
  Query: {
    posts: auth
  },
  Mutation: {
    createPost: auth
  }
}

module.exports = shield(resolvers, permissions)