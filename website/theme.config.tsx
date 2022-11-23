/* eslint-disable react-hooks/rules-of-hooks */
/* eslint sort-keys: error */
import { defineConfig, Giscus, useTheme } from '@theguild/components'
import { useRouter } from 'next/router'

export default defineConfig({
  docsRepositoryBase: 'https://github.com/dimatill/graphql-shield/tree/master/website',
  head: (
    <>
      {/* Icons */}
      <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
      <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
      <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/manifest.json" />
      <meta name="msapplication-TileColor" content="#fff" />
      <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
      {/* Splitbee */}
      <script async src="https://cdn.splitbee.io/sb.js" />
    </>
  ),
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
