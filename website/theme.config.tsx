/* eslint-disable react-hooks/rules-of-hooks */
/* eslint sort-keys: error */
import { defineConfig, Giscus, useTheme } from '@theguild/components'
import { useRouter } from 'next/router'

export default defineConfig({
  docsRepositoryBase: 'https://github.com/dimatill/graphql-shield/tree/master/website',
  main({ children }) {
    const { resolvedTheme } = useTheme()
    const { route } = useRouter()

    const comments = route !== '/' && (
      <Giscus
        // ensure giscus is reloaded when client side route is changed
        key={route}
        repo="dimatill/graphql-shield"
        repoId="MDEwOlJlcG9zaXRvcnkxMjExNDc1NTQ="
        category="Docs Discussions"
        categoryId="DIC_kwDOBziQos4CSDVt"
        mapping="pathname"
        theme={resolvedTheme}
      />
    )
    return (
      <>
        {children}
        {comments}
      </>
    )
  },
  siteName: 'SHIELD',
})
