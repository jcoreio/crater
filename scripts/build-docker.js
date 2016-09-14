#!/usr/bin/env babel-node

import asyncScript from './util/asyncScript'
import execAsync from './util/execAsync'
import spawnAsync from './util/spawnAsync'
import path from 'path'

process.on('SIGINT', () => process.exit(1))

const opts = {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit'
}

asyncScript(async () => {
  await spawnAsync('npm', ['run', 'build'], opts)
  const commitHash = (await execAsync('git rev-parse HEAD', {silent: true})).stdout.trim()
  await spawnAsync('docker', ['build', '-t', `jedwards1211/crater:${commitHash}`, '.'], opts)
})
