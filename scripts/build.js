#!/usr/bin/env babel-node

import asyncScript from '../util/asyncScript'
import spawnAsync from '../util/spawnAsync'

process.on('SIGINT', () => process.exit(1))

const opts = {
  stdio: 'inherit',
}

asyncScript(async () => {
  await spawnAsync('npm', ['run', 'build:meteor'], opts)
  await spawnAsync('npm', ['run', 'build:server'], opts)
  await spawnAsync('npm', ['run', 'build:client'], opts)
})
