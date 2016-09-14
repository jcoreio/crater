#!/usr/bin/env babel-node

import spawnAsync from '../util/spawnAsync'
import isDirectory from '../util/isDirectory'
import path from 'path'

const build = path.resolve(__dirname, '..', 'build')
const programsServer = path.join(build, 'meteor', 'bundle', 'programs', 'server')

async function installMeteorDeps() {
  if (!(await isDirectory(path.join(programsServer, 'node_modules')))) {
    console.log('installing Meteor npm dependencies...')
    await spawnAsync('npm', ['install'], {
      cwd: programsServer,
      stdio: 'inherit'
    })
  } else {
    console.log('Meteor npm dependencies are up to date')
  }
}

export default installMeteorDeps

