
const users = [{
   id: '1',
   name: 'matic',
   password: 'berries'
}]

// This is example purpose only!
exports.verify = ctx => {
   const Authorization = ctx.request.get('Authorization')
   
   if (Authorization) {
      const token = Authorization.replace('Bearer ', '')
      return users.some(user => user.id === token)
   }
   return false
}