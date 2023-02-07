import { execute, graphql, parse } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { shield, rule } from '../src/index'
import { IHashFunction } from '../src/types'
import { wrapExecuteFn } from '../src/shield'

describe('caching:', () => {
  test('Strict cache - Rule is called multiple times, based on different parent.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: [Test!]!
      }
  
      type Test {
        value: String!
      }
    `
    const resolvers = {
      Query: {
        test: () => [{ value: 'pass-A' }, { value: 'pass-A' }, { value: 'pass-B' }],
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const ruleTree = {
      Test: rule({ cache: 'strict' })(allowMock),
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */

    const query = `
      query {
        test {
          value
        }
      }
    `

    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })

    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    expect(res).toEqual({
      data: {
        test: [{ value: 'pass-A' }, { value: 'pass-A' }, { value: 'pass-B' }],
      },
    })
    expect(allowMock).toBeCalledTimes(2)
  })

  test('Strict cache - Rule is called multiple times, based on different arguments.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String!
        b: String!
        c(arg: String): String!
        d(arg: String): String!
        e(arg: String): String!
      }
    `
    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        c: () => 'c',
        d: () => 'd',
        e: () => 'e',
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Tests */

    const allowMock = jest.fn().mockResolvedValue(true)

    const ruleTree = {
      Query: rule({ cache: 'strict' })(allowMock),
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */

    const query = `
      query {
        a
        b
        c(arg: "foo")
        d(arg: "bar")
        e
        f: c(arg: "foo")
      }
    `

    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })
    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    /* Tests */

    expect(res).toEqual({
      data: {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        e: 'e',
        f: 'c',
      },
    })
    expect(allowMock).toBeCalledTimes(3)
  })

  test('Contextual Cache - rules get executed only once if reused.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String!
        b: String!
        c(arg: String): String!
        d(arg: String): String!
        e(arg: String): String!
      }
    `
    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        c: () => 'c',
        d: () => 'd',
        e: () => 'e',
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */

    const ruleOneMock = jest.fn().mockResolvedValue(true)
    const ruleOne = rule({ cache: 'contextual' })(ruleOneMock)

    const ruleTwoMock = jest.fn().mockResolvedValue(true)
    const ruleTwo = rule({ cache: 'contextual' })(ruleTwoMock)

    const ruleTree = {
      Query: {
        a: ruleOne,
        b: ruleOne,
        c: ruleOne,
        d: ruleTwo,
        e: ruleTwo,
      },
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    // Execution
    const query = `
      query {
        a
        b
        c(arg: "foo")
        d(arg: "bar")
        e
      }
    `

    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })
    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    /* Tests */

    expect(res).toEqual({
      data: {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        e: 'e',
      },
    })
    expect(ruleOneMock).toBeCalledTimes(1)
    expect(ruleTwoMock).toBeCalledTimes(1)
  })

  test('No Cache - rule is reexecuted every time.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String!
        b: String!
        c(arg: String): String!
        d(arg: String): String!
        e(arg: String): String!
      }
    `
    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        c: () => 'c',
        d: () => 'd',
        e: () => 'e',
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const allow = rule({ cache: 'no_cache' })(allowMock)

    const ruleTree = {
      Query: allow,
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */

    const query = `
      query {
        a
        b
        c(arg: "foo")
        d(arg: "bar")
        e
      }
    `
    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })

    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    /* Tests */

    expect(res).toEqual({
      data: {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        e: 'e',
      },
    })
    expect(allowMock).toBeCalledTimes(5)
  })

  test('Custom cache key function - Rule is called based on custom cache key', async () => {
    /* Schema */
    const typeDefs = `
      type Query {
        a(arg: String): String!
        b(arg: String): String!
      }
    `
    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Tests */

    const allowMock = jest.fn().mockResolvedValue(true)

    const ruleTree = {
      Query: rule({
        cache: (parent, args, ctx, info) => {
          return JSON.stringify(args)
        },
      })(allowMock),
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */

    const query = `
      query {
        a(arg: "foo")
        b(arg: "bar")
        a2: a(arg: "foo")
        a3: a(arg: "boo")
      }
    `
    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })

    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    /* Tests */

    expect(res).toEqual({
      data: {
        a: 'a',
        b: 'b',
        a2: 'a',
        a3: 'a',
      },
    })
    expect(allowMock).toBeCalledTimes(3)
  })
})

test('Customize hash function', async () => {
  /* Schema */
  const typeDefs = `
      type Query {
        a(arg: String): String!
        b(arg: String): String!
      }
    `
  const resolvers = {
    Query: {
      a: () => 'a',
      b: () => 'b',
    },
  }

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  })

  /* Tests */

  const allowMock = jest.fn().mockResolvedValue(true)

  const hashFunction: IHashFunction = jest.fn((opts) => JSON.stringify(opts))

  const ruleTree = {
    Query: rule({ cache: 'strict' })(allowMock),
  }

  // const schemaWithPermissions = shield(schema, ruleTree, {
  //   hashFunction,
  // })

  /* Execution */

  const query = `
      query {
        a(arg: "foo")
        b(arg: "bar")
      }
    `

  const res = await wrapExecuteFn(execute, { schema, ruleTree, options: { hashFunction } })({ schema, document: parse(query) })

  // const res = await graphql({
  //   schema: schemaWithPermissions,
  //   source: query,
  //   contextValue: {},
  // })

  /* Tests */

  expect(res).toEqual({
    data: {
      a: 'a',
      b: 'b',
    },
  })
  expect(allowMock).toBeCalledTimes(2)
  expect(hashFunction).toHaveBeenCalledTimes(2)
  expect(hashFunction).toHaveBeenCalledWith({
    parent: undefined,
    args: { arg: 'foo' },
  })
  expect(hashFunction).toHaveBeenCalledWith({
    parent: undefined,
    args: { arg: 'bar' },
  })
})

describe('legacy cache:', () => {
  test('Strict cache - Rule is called multiple times, based on different parent.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        test: [Test!]!
      }
  
      type Test {
        value: String!
      }
    `
    const resolvers = {
      Query: {
        test: () => [{ value: 'pass-A' }, { value: 'pass-A' }, { value: 'pass-B' }],
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */

    const allowMock = jest.fn().mockResolvedValue(true)
    const ruleTree = {
      Test: rule({ cache: true })(allowMock),
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    /* Execution */

    const query = `
      query {
        test {
          value
        }
      }
    `
    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })

    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    /* Tests */

    expect(res).toEqual({
      data: {
        test: [{ value: 'pass-A' }, { value: 'pass-A' }, { value: 'pass-B' }],
      },
    })
    expect(allowMock).toBeCalledTimes(2)
  })

  test('No Cache - rule is reexecuted every time.', async () => {
    /* Schema */

    const typeDefs = `
      type Query {
        a: String!
        b: String!
        c(arg: String): String!
        d(arg: String): String!
        e(arg: String): String!
      }
    `
    const resolvers = {
      Query: {
        a: () => 'a',
        b: () => 'b',
        c: () => 'c',
        d: () => 'd',
        e: () => 'e',
      },
    }

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    /* Permissions */
    const allowMock = jest.fn().mockResolvedValue(true)
    const allow = rule({ cache: false })(allowMock)

    const ruleTree = {
      Query: allow,
    }

    // const schemaWithPermissions = shield(schema, ruleTree)

    // Execution
    const query = `
      query {
        a
        b
        c(arg: "foo")
        d(arg: "bar")
        e
      }
    `

    const res = await wrapExecuteFn(execute, { schema, ruleTree })({ schema, document: parse(query) })

    // const res = await graphql({
    //   schema: schemaWithPermissions,
    //   source: query,
    //   contextValue: {},
    // })

    expect(res).toEqual({
      data: {
        a: 'a',
        b: 'b',
        c: 'c',
        d: 'd',
        e: 'e',
      },
    })
    expect(allowMock).toBeCalledTimes(5)
  })
})
