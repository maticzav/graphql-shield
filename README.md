# @siteminder/graphql-permissions

A drop-in replacement for [`graphql-shield`](https://github.com/maticzav/graphql-shield), built to unblock migration to Node 24.

## Background

`graphql-shield@7.6.5` calls `util.isUndefined()`, which was removed in Node 24. This causes every GraphQL request to fail with:

```
(0 , util_1.isUndefined) is not a function
```

The fix was merged upstream ([#1552](https://github.com/maticzav/graphql-shield/pull/1552)) but no new version has been published, and the repo appears largely unmaintained. Rather than waiting on an upstream release or patching a transitive dependency, this package reimplements the `graphql-shield` API on top of [`graphql-middleware`](https://github.com/nicholasgasior/graphql-middleware) with no dependency on the removed Node utility.

## Usage

```typescript
import { shield, rule, allow, deny, and, or, not } from '@siteminder/graphql-permissions'
import { applyMiddleware } from 'graphql-middleware'

const isAuthenticated = rule()(async (parent, args, ctx, info) => {
  return ctx.user !== null
})

const isAdmin = rule()(async (parent, args, ctx, info) => {
  return ctx.user?.role === 'admin'
})

const permissions = shield({
  Query: {
    me: isAuthenticated,
    users: and(isAuthenticated, isAdmin),
  },
  Mutation: {
    createUser: isAdmin,
  },
})

const schema = applyMiddleware(yourSchema, permissions)
```

## API

### `shield(ruleTree, options?)`

Generates a `graphql-middleware` instance from a rule tree.

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fallbackRule` | `ShieldRule` | `allow` | Rule applied to fields not covered by the rule tree |
| `fallbackError` | `string \| Error \| IFallbackErrorMapperType` | `new Error('Not Authorised!')` | Error returned when a rule denies access |
| `allowExternalErrors` | `boolean` | `false` | Pass rule errors through to the client |
| `debug` | `boolean` | `false` | Throw rule errors instead of handling them |
| `hashFunction` | `IHashFunction` | `JSON.stringify` | Custom hash function for strict cache mode |

### `rule(name?, options?)(fn)`

Creates a rule from an async function. The function receives `(parent, args, ctx, info)` and should return `true` to allow, or `false`/`Error`/`string` to deny.

**Cache modes** (via `options.cache`):
- `'contextual'` (default) — cached per request context
- `'strict'` — cached per unique `(parent, args)` combination
- `'no_cache'` — never cached

```typescript
const isOwner = rule({ cache: 'strict' })(async (parent, args, ctx) => {
  return parent.ownerId === ctx.user.id
})
```

### Combinators

| Combinator | Description |
|------------|-------------|
| `allow` | Always allows |
| `deny` | Always denies |
| `and(...rules)` | Allows if all rules pass — evaluates all rules **in parallel**, so all branches execute even if one fails |
| `or(...rules)` | Allows if any rule passes — evaluates all rules in parallel |
| `not(rule, error?)` | Inverts a rule |
| `chain(...rules)` | Like `and`, but evaluates rules **sequentially** and stops on the first failure — use this when rules have dependencies or side effects |
| `race(...rules)` | Like `or`, but evaluates rules **sequentially** and stops on the first success |

## Migration from `graphql-shield`

This package is API-compatible with `graphql-shield`. Replace the import:

```diff
- import { shield, rule, allow, deny } from 'graphql-shield'
+ import { shield, rule, allow, deny } from '@siteminder/graphql-permissions'
```
