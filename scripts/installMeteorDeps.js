#!/usr/bin/env babel-node
// @flow

import spawnAsync from 'crater-util/lib/spawnAsync'
import isDirectory from 'crater-util/lib/isDirectory'
import path from 'path'
import buildDir from '../buildDir'

const programsServer = path.join(buildDir, 'meteor', 'bundle', 'programs', 'server')

async function installMeteorDeps(): Promise<any> {
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

