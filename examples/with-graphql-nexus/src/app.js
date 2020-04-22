const express = require('express')
const cookieParser = require('cookie-parser')
const { applyMiddleware } = require('graphql-middleware')
const { ApolloServer } = require('apollo-server-express')

const { authorization } = require('./lib/middlewares/authorization')
const { schema: baseSchema } = require('./schema')
const { permissions } = require('./lib/permissions')
const { prisma } = require('./generated/prisma-client')

const app = express()
app.use(cookieParser())
app.use(authorization())

const schema = applyMiddleware(baseSchema, permissions)
const server = new ApolloServer({
  context: ({ req, res }) => ({
    prisma,
    request: req,
    response: res,
  }),
  schema,
})

server.applyMiddleware({ app, path: '/' })

module.exports = { app }
