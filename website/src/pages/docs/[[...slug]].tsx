import Head from 'next/head'

import { DocsContent, DocsTOC, MDXPage } from '@guild-docs/client'
import { MDXPaths, MDXProps } from '@guild-docs/server'

import { getRoutes } from '../../../routes'

import type { GetStaticPaths, GetStaticProps } from 'next'

export default MDXPage(
  function PostPage({ content, TOC, MetaHead, BottomNavigation }) {
    return (
      <>
        <Head>{MetaHead}</Head>
        <DocsContent>{content}</DocsContent>
        <DocsTOC>
          <TOC
            wrapperProps={{
              paddingRight: '0.5em',
            }}
          />
          <BottomNavigation />
        </DocsTOC>
      </>
    )
  },
  {
    renderTitle(title) {
      if (!title) return 'GraphQL Shield'
      return `${title} - GraphQL Shield`
    },
  },
)

export const getStaticProps: GetStaticProps = (ctx) => {
  return MDXProps(
    ({ readMarkdownFile, getArrayParam }) => {
      return readMarkdownFile('docs/', getArrayParam('slug'))
    },
    ctx,
    {
      getRoutes,
    },
  )
}

export const getStaticPaths: GetStaticPaths = async (ctx) => {
  return MDXPaths('docs', { ctx })
}
