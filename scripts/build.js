#!/usr/bin/env babel-node
// @flow

import asyncScript from './util/asyncScript'
import spawnAsync from './util/spawnAsync'
import path from 'path'

process.on('SIGINT', (): any => process.exit(1))

const opts = {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
}

asyncScript(async (): Promise<void> => {
  await spawnAsync('npm', ['run', 'build:meteor'], opts)
  await spawnAsync('npm', ['run', 'build:server'], opts)
  await spawnAsync('npm', ['run', 'build:client'], opts)
})
