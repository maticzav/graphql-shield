import emoji from 'remark-emoji'

export default {
  title: 'GraphQL Shield',
  themeConfig: {
    colors: {
      primary: 'tomato',
    },
  },
  public: './media',
  htmlContext: {
    favicon: 'public/favicon.ico',
  },
  mdPlugins: [emoji],
}
