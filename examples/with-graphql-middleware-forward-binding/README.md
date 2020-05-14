# with-graphql-middleware-forward-bindings

> WIP

This is an example showing how to use `graphql-shield` with [graphql-middleware-forward-binding](https://github.com/maticzav/graphql-middleware-forward-binding)

## Try these out

> Add `katt`, `req` or `anny` as _authorization_ header in Playground.

| user | role     |
| ---- | -------- |
| katt | customer |
| rey  | editor   |
| rey  | admin    |

### Queries and Mutations

```graphql
query AdminSeeAllPosts {
  posts {
    id
    text
  }
}

mutation CreatePost {
  createPost(
    data: {
      title: "Let's do some magic!"
      text: "Dude, you ainn no Harry Potter!"
      owner: { connect: { name: "anny" } }
    }
  ) {
    id
  }
}
```

## License

MIT @ Matic Zavadlal
