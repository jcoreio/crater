#!/usr/bin/env babel-node

import spawn from '../util/spawn'
import spawnAsync from '../util/spawnAsync'
import asyncScript from '../util/asyncScript'
import isDirectory from '../util/isDirectory'
import path from 'path'

process.on('SIGINT', () => process.exit(1))

const env = {
  ...process.env,
  NODE_ENV: 'production',
  USE_DOTENV: 1,
}

const build = path.resolve(__dirname, '..', 'build')
const programsServer = path.join(build, 'meteor', 'bundle', 'programs', 'server')

asyncScript(async () => {
  await spawnAsync('npm', ['run', 'build'], {stdio: 'inherit'})
  if (!(await isDirectory(path.join(programsServer, 'node_modules')))) {
    console.log('installing Meteor node modules...')
    await spawnAsync('npm', ['install'], {
      cwd: programsServer,
      stdio: 'inherit'
    })
  }
  spawn('supervisor', ['-w', build, path.join(build, 'index.js')], {env, stdio: 'inherit'})
}, {
  exitOnSuccess: false,
})

