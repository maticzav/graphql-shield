const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const execa = require('execa')

/* Constants */

const PACKAGES_DIR = path.resolve(__dirname, '../packages')

/* Find all packages */

const packages = fs
  .readdirSync(PACKAGES_DIR)
  .map((file) => path.resolve(PACKAGES_DIR, file))
  .filter((f) => fs.lstatSync(path.resolve(f)).isDirectory())
  .filter((p) => fs.existsSync(path.resolve(p, 'tsconfig.json')))

/* Build */

// ----------- //
/* Static part */
// ----------- //

console.log(`
${chalk.reset.inverse.bold.cyan(' BUILDING ')}
${packages.map((build) => `- ${build}`).join('\n')}
`)

const args = ['-b', ...packages, ...process.argv.slice(2)]

console.log(chalk.inverse('Building TypeScript definition files\n'))

try {
  execa.sync('tsc', args, { stdio: 'inherit' })
  process.stdout.write(`${chalk.reset.inverse.bold.green(' DONE ')}\n`)
} catch (e) {
  process.stdout.write('\n')
  console.error(
    chalk.inverse.red('Unable to build TypeScript definition files'),
  )
  console.error(e.stack)
  process.exitCode = 1
}
