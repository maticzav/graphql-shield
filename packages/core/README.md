# `@shield/core`

This is the core package of GraphQL Shield. You can find full docs at https://graphql-shield.com/docs.

### PARTS

https://www.graphql-tools.com/docs/resolvers-composition

https://github.com/dotansimha/envelop/blob/main/packages/core/src/plugins/use-masked-errors.ts

- framents -> required fields (we pull them out and modify the schema in the validation step)
- two rule types (contextual and strict) we never cache any of them -> contextual = validation, strict -> execution
- on validation level, all rules must pass to continue to execution phase
- on execution level, rule errors are going to bubble up the way rules bubble up regularly
- operators: and, or, not, true, false, chain, race (schema enforced)
- change `defaultRule` with "\*" option in schema.

## Example

```ts
import useShield, * as rules from '@shield/envelop'

const permissions = useShield(
  {
    Query: {},
  },
  { silent: true, debug: false },
)
```

```ts
import shield, * as rules from '@shield/core'

shield({
  Query: {
    '*': rules.allow(),
    me: rules.or([
      rules.allow(),
      rules.and([authenticated, kind]),
      rules.and([authenticated, superuser, member]),
    ]),
  },
})
```

## Similar Libraries

- https://github.com/AstrumU/graphql-authz
- https://github.com/dotansimha/envelop/tree/main/packages/plugins/operation-field-permissions

## Learning Resources

If you are interested in ideas behind GraphQL Shield, I recommend you watch the following resources.

- https://www.youtube.com/watch?v=fo6X91t3O2I
- https://www.envelop.dev/docs/plugins/lifecycle
- https://github.com/Microsoft/TypeScript/wiki/FAQ#can-i-make-a-type-alias-nominal
- https://the-guild.dev/blog/introducing-envelop
