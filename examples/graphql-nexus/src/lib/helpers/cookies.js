const jwt = require('jsonwebtoken')

function generateToken(payload) {
  return jwt.sign(payload, process.env.APP_SECRET)
}

function setCookie(response, token) {
  response.cookie('token', `Bearer ${token}`, {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
  })
}

module.exports = {
  generateToken,
  setCookie,
}
