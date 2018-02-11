const fs = require('fs')
const {
  replaceInFiles,
  deploy,
  writeEnv,
  getInfo,
} = require('graphql-boilerplate-install')

module.exports = async ({ project, projectDir }) => {
  const templateName = 'graphql-boilerplate'

  replaceInFiles(
    ['src/index.ts', 'package.json', 'database/prisma.yml'],
    templateName,
    project,
  )

  console.log('Running $ prisma deploy...')
  await deploy(false)

  const info = await getInfo()
  const cluster = info.workspace
    ? `${info.workspace}/${info.cluster}`
    : info.cluster

  replaceInFiles(['.env'], '__PRISMA_ENDPOINT__', info.httpEndpoint)

  replaceInFiles(['.env'], `__PRISMA_CLUSTER__`, cluster)
  replaceInFiles(
    ['database/prisma.yml'],
    `cluster: ${cluster}`,
    'cluster: ${env:PRISMA_CLUSTER}',
  )

  fs.appendFileSync('.gitignore', '.env*\n')

  console.log(`\
Next steps:
  1. Change directory: \`cd ${projectDir}\`
  2. Start local server and open Playground: \`yarn dev\`
`)
}
