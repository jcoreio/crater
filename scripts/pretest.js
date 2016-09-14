#! /usr/bin/env babel-node
// @flow

import asyncScript from '../util/asyncScript'
import spawnAsync from '../util/spawnAsync'

process.on('SIGINT', (): any => process.exit(1))

asyncScript(async (): Promise<void> => {
  await spawnAsync('npm', ['run', 'flow'], {stdio: 'inherit'})
  await spawnAsync('npm', ['run', 'lint'], {stdio: 'inherit'})
})
