const { inputObjectType } = require('nexus')

const LoginInput = inputObjectType({
  name: 'LoginInput',
  definition(t) {
    t.field('email', {
      type: 'String',
    })
    t.field('password', {
      type: 'String',
    })
  },
})

module.exports = {
  LoginInput,
}
