#!/usr/bin/env node

const { spawn, exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const yaml = require('js-yaml')

const yargs = require('yargs')

const spawnPromise = (command, args, options) => {
  return new Promise((resolve) => {
    spawn(command, args, options).on('close', resolve)
  })
}

const isFile = (path) => {

  try {
    return fs.lstatSync(path).isFile()
  } catch (e) {
    return false
  }
}

const loadPlaypenFile = async () => {

  const projectRoot = await new Promise((resolve) => {
    exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
      resolve(projectRoot.trim())
    })
  })

  if (fs.existsSync(`${projectRoot}/playpen/docker-compose.yaml`)) {
    return fs.readFileSync(`${projectRoot}/playpen/docker-compose.yaml`, 'utf8')
  }

  throw new Error('No playpen/docker-compose.yaml')
}

yargs
  .command(
    ['start [--fast] [--profile] [--services]'],
    'start infras services (everything unless services is specified)',
    (yargs) => {

      return Promise.resolve()
        .then(async () => {
          return yargs
            .option('profile', {
              alias: 'p',
              describe: 'start infras services associated with a docker profile, see https://docs.docker.com/compose/profiles/',
              type: 'string'
            })
            .option('services', {
              alias: 's',
              describe: 'start infras services (everything unless services is specified)',
              type: 'array',
              choices: Object.keys(yaml.load(await loadPlaypenFile()).services),
            })
            .option('fast', {
              alias: 'f',
              describe: 'start faster by skipping docker pull',
              type: 'boolean'
            })
        })
    },
    async (argv) => {

      const projectRoot = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
          resolve(projectRoot.trim())
        })
      })

      const pkgJson = require(`${projectRoot}/package.json`)

      if (pkgJson['scripts'] && pkgJson['scripts']['playpen:start']) {

        return await spawnPromise(
          `npm`,
          ['run', 'playpen:start'],
          {
            stdio: 'inherit',
            cwd: projectRoot,
          }
        )
      }

      let params = []

      if (argv.services) {
        params = params.concat(['-s', argv.services.join(' ')])
      }

      if (argv.profile) {
        params = params.concat(['-p', argv.profile])
      }

      if (argv.fast) {
        params = params.concat(['-f'])
      }

      await spawnPromise(
        `${path.dirname(require.main.filename)}/shared/playpen/start.sh`,
        params,
        { stdio: 'inherit' }
      )
    }
  )
  .command(
    ['stop', 'destroy'],
    'stop infrastructure services',
    (yargs) => { },
    async (argv) => {

      await spawnPromise(
        `${path.dirname(require.main.filename)}/shared/playpen/stop.sh`,
        [],
        { stdio: 'inherit' }
      )
    }
  )
  .command(
    'run-dev <compose-file|module>',
    'start server via npm run dev',
    (yargs) => { },
    async (argv) => {

      const projectRoot = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
          resolve(projectRoot.trim())
        })
      })

      const composeFile = [
        argv.composeFile,
        `${projectRoot}/components/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/libs/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/frontends/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/packages/${argv.composeFile}/docker-compose.yaml`,
      ].find(isFile)

      if (!composeFile) {
        console.log(`Error: unable to find docker-compose.yaml with given param '${argv.composeFile}'`)
        return
      }

      const service = path.basename(path.dirname(path.resolve(composeFile)))

      const params = [
        path.resolve(composeFile),
        '',
        'run',
        '--rm',
        '--service-ports',
        '--name',
        service,
        service,
        'bash',
        '-c',
        'set -e; npm ci --no-audit --include-workspace-root && npm run dev',
      ]

      spawn(`${path.dirname(require.main.filename)}/shared/playpen/module-compose.sh`, params, { stdio: 'inherit' })
    }
  )
  .command(
    'run-test <compose-file|module>',
    'run tests',
    (yargs) => { },
    async (argv) => {

      const projectRoot = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
          resolve(projectRoot.trim())
        })
      })

      const composeFile = [
        argv.composeFile,
        `${projectRoot}/components/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/libs/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/frontends/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/packages/${argv.composeFile}/docker-compose.yaml`,
      ].find(isFile)

      if (!composeFile) {
        console.log(`Error: unable to find docker-compose.yaml with given param '${argv.composeFile}'`)
        return
      }

      const service = path.basename(path.dirname(path.resolve(composeFile)))

      const params = [
        path.resolve(composeFile),
        '',
        'run',
        '--rm',
        service,
        'bash',
        '-c',
        'set -e; npm ci --no-audit --include-workspace-root && npm run test',
      ]

      spawn(`${path.dirname(require.main.filename)}/shared/playpen/module-compose.sh`, params, { stdio: 'inherit' })
    }
  )
  .command(
    'run <compose-file|module>',
    'perform arbitary command in <module>',
    {
      'service-ports': {
        default: false,
        type: 'boolean',
      },
    },
    async (argv) => {

      const projectRoot = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
          resolve(projectRoot.trim())
        })
      })

      const composeFile = [
        argv.composeFile,
        `${projectRoot}/components/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/libs/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/frontends/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/packages/${argv.composeFile}/docker-compose.yaml`,
      ].find(isFile)

      if (!composeFile) {
        console.log(`Error: unable to find docker-compose.yaml with given param '${argv.composeFile}'`)
        return
      }

      const service = path.basename(path.dirname(path.resolve(composeFile)))

      const params = [
        path.resolve(composeFile),
        '',
        'run',
        '--rm',
      ]

      if (argv.servicePorts) {
        params.push('--service-ports')
      }

      params.push(service)
      params.push(...argv._.splice(1))

      spawn(`${path.dirname(require.main.filename)}/shared/playpen/module-compose.sh`, params, { stdio: 'inherit' })
    }
  )
  .command(
    'up <compose-file|module> [service]',
    'bring up a <module> [service] defaults to module name unless specified',
    (yargs) => { },
    async (argv) => {

      const projectRoot = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
          resolve(projectRoot.trim())
        })
      })

      const composeFile = [
        argv.composeFile,
        `${projectRoot}/components/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/libs/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/frontends/${argv.composeFile}/docker-compose.yaml`,
        `${projectRoot}/packages/${argv.composeFile}/docker-compose.yaml`,
      ].find(isFile)

      if (!composeFile) {
        console.log(`Error: unable to find docker-compose.yaml with given param '${argv.composeFile}'`)
        return
      }

      const service = argv.service || path.basename(path.dirname(path.resolve(composeFile)))

      const params = [
        path.resolve(composeFile),
        'playpen-up',
        'up',
        '-d',
        service,
      ]

      spawn(`${path.dirname(require.main.filename)}/shared/playpen/module-compose.sh`, params, { stdio: 'inherit' })
    }
  )
  .command(
    'compose',
    'perform arbitary command in infrastructure',
    (yargs) => { },
    async (argv) => {

      spawn(
        `${path.dirname(require.main.filename)}/shared/playpen/infras-compose.sh`,
        argv._.splice(1),
        { stdio: 'inherit' }
      )
        .on('exit', code => process.exit(code))
    }
  )
  .command(
    'seed',
    'run the seed service in playpen/seed/docker-compose.yaml',
    (yargs) => { },
    async (argv) => {

      const projectRoot = await new Promise((resolve) => {
        exec('git rev-parse --show-toplevel', { cwd: path.dirname(require.main.filename) }, (err, projectRoot, stderr) => {
          resolve(projectRoot.trim())
        })
      })

      const composeFile = [
        `${projectRoot}/playpen/seed/docker-compose.yaml`,
      ].find(isFile)

      if (!composeFile) {
        console.log('Error: unable to find playpen/seed/docker-compose.yaml')
        return
      }

      const params = [
        path.resolve(composeFile),
        '',
        'run',
        '--rm',
        'seed',
      ]

      spawn(`${path.dirname(require.main.filename)}/shared/playpen/module-compose.sh`, params, { stdio: 'inherit' })
    }
  )
  .help()
  .wrap(yargs.terminalWidth())
  .completion('completion', `run this command to see installation instructions in the generated completion script`)
  .argv
