const config = require('@theguild/tailwind-config');

module.exports = {
  ...config,
  content: [
    './src/**/*.{tsx,mdx}',
    './theme.config.tsx',
    '../node_modules/.pnpm/node_modules/nextra-theme-docs/dist/**/*.js',
    '../node_modules/.pnpm/node_modules/@theguild/components/dist/**/*.{js,mjs}'
  ],
}
