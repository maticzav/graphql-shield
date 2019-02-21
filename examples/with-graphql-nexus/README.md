# with-graphql-nexus

> using [nexus-prisma](https://github.com/prisma/nexus-prisma/)

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)

This is an example of how to use `graphql-shield` with [GraphQL Nexus](https://nexus.js.org/).

## Dependencies

- Your favourite package manager

- [Prisma CLI](https://github.com/prisma/prisma/tree/master/cli)

- [Docker](https://docs.docker.com/install/) & [Docker Compose](https://docs.docker.com/compose/install/)

## Content

The application uses `cookie-parser` middleware for `express` and a custom `authorization` middleware to set `userId` property on the request object. This property is used by `graphql-shield` in the `isAuthenticated`-rule.

There are only two mutations that are available without authentication and those are `login` and `signup`. All queries are protected with `graphql-shield`.

### Steps to get 'up & running'

You can replace `yarn` with `npm`

1. `yarn install`

2. `docker-compose up -d`

3. `prisma deploy`

4. Create a `.env` with an `APP_SECRET` field or rename `.env.example`.

5. `yarn start` or `yarn start:dev` for auto-rebuild on change.

6. Navigate to [`http://localhost:4001/`](http://localhost:4001/).

7. In the top-right corner of GraphQL Playground, click the cogwheel, and change the property `request.credentials` from `omit` to `same-origin`. This is needed for GraphQL Playground to use cookies.

8. Have fun!

### Queries and Mutations

```graphql
mutation LOGIN {
  login(data: { email: "test@email.com", password: "bananas" }) {
    id
  }
}

mutation SIGNUP {
  signup(
    data: {
      email: "test@email.com"
      password: "bananas"
      name: "Monkey Business"
    }
  ) {
    id
  }
}

query ME {
  me {
    id
    email
    name
  }
}

query USERS {
  users {
    id
    email
    name
  }
}
```

## License

MIT @ [Christian A. Jacobsen](https://www.github.com/ChristianJacobsen/)
