const path = require('path')
const { makePrismaSchema } = require('nexus-prisma')

const datamodelInfo = require('../generated/nexus-prisma')
const { prisma } = require('../generated/prisma-client')

const { Query } = require('./queries')
const { Mutation } = require('./mutations')
const { types } = require('./types')
const { inputTypes } = require('./input-types')

const schema = makePrismaSchema({
  nonNullDefaults: {
    input: true,
    output: true,
  },
  outputs: {
    schema: path.join(__dirname, '../generated/schema.graphql'),
  },
  prisma: {
    client: prisma,
    datamodelInfo,
  },
  types: [Query, Mutation, ...types, ...inputTypes],
})

module.exports = { schema }
