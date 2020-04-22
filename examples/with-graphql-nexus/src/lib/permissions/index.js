const { allow, shield } = require('graphql-shield')

const { isAuthenticated } = require('./rules/is-authenticated')

const permissions = shield({
  Query: {
    '*': isAuthenticated,
  },
  Mutation: {
    '*': isAuthenticated,
    login: allow,
    signup: allow,
  },
})

module.exports = {
  permissions,
}
