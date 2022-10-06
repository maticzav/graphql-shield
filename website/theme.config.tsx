/* eslint sort-keys: error */
import { ShieldLogo, defineConfig } from '@theguild/components'

const SITE_NAME = 'GraphQL Shield'

export default defineConfig({
  docsRepositoryBase: 'https://github.com/dimatill/graphql-shield/tree/master/website',
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={`${SITE_NAME}: documentation`} />
      <meta name="og:title" content={`${SITE_NAME}: documentation`} />

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
      <meta name="theme-color" content="#fff" />
      {/* Splitbee */}
      <script async src="https://cdn.splitbee.io/sb.js"/>
    </>
  ),
  logo: (
    <>
      <ShieldLogo className="mr-1.5 h-9 w-9" />
      <h1 className="md:text-md text-sm font-medium">{SITE_NAME}</h1>
    </>
  ),
  titleSuffix: ` – ${SITE_NAME}`,
})

// const defaultSeo: AppSeoProps = {
//   title: 'GraphQL Shield',
//   description: 'A GraphQL tool to ease the creation of permission layers.',
//   logo: {
//     url: 'https://www.graphql-shield.com/logo.png',
//     width: 50,
//     height: 54,
//   },
// }
