# About

A simple example that shows how to connect `graphql-shield` with `apollo-server-lambda`, using `graphlq-middleware`.

- [graphql-shield](https://github.com/maticzav/graphql-shield)
- [apollo-server-lambda](https://github.com/apollographql/apollo-server/blob/master/docs/source/deployment/lambda.md)
- [graphql-middleware](https://github.com/prisma/graphql-middleware)

# Run

Just clone the repo, run `npm install` and then `npm start` to start the GraphQL server on `http://localhost:3000`.

Running the following query in your GraphQL client will result with an authorization error:

```graphql
{
  hello
}
```

![GithubLogo](https://cdn.pbrd.co/images/HUNlLBs.png)

---

Courtesy of @doitadrian.
