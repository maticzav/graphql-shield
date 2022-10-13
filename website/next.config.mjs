import { withGuildDocs } from '@theguild/components/next.config'

export default withGuildDocs({
  redirects: () =>
    Object.entries({}).map(([from, to]) => ({
      source: from,
      destination: to,
      permanent: true,
    })),
})
