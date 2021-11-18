const jwt = require('jsonwebtoken')

function authorization() {
  return function (req, res, next) {
    const { token } = req.cookies
    if (!token) {
      return next()
    }

    try {
      const { userId } = jwt.verify(
        token.replace('Bearer ', ''),
        process.env.APP_SECRET,
      )

      req.userId = userId
    } catch (error) {
      res.clearCookie('token')
    }

    return next()
  }
}

module.exports = {
  authorization,
}
