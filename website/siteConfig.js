module.exports = {
  title: 'GraphQL Shield',
  tagline: 'GraphQL Server permissions as another layer of abstraction',
  organizationName: 'maticzav',
  projectName: 'graphql-shield',
  baseUrl: '/',
  customDocsPath: './docs',
  url: 'https://graphql-shield.netlify.com',
  headerIcon: 'img/shield.png',
  favicon: 'img/shield.ico',
  ogImage: 'img/shield.png',
  twitterImage: 'img/shield.png',
  headerLinks: [
    { search: true },
    { blog: true, label: 'Blog' },
    {
      href: 'https://github.com/maticzav/graphql-shield',
      label: 'GitHub',
    },
  ],
  colors: {
    primaryColor: '#382873',
    secondaryColor: '#fff',
  },
  highlight: {
    theme: 'default',
  },
  algolia: {
    apiKey: '',
    indexName: 'graphql-shield',
    algoliaOptions: {},
  },
  github: 'https://github.com/maticzav/graphql-shield',
  scripts: ['https://buttons.github.io/buttons.js'],
  copyright: `Copyright © ${new Date().getFullYear()} Matic Zavadlal`,
}
