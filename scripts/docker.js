#!/usr/bin/env babel-node

import asyncScript from '../util/asyncScript'
import execAsync from '../util/execAsync'
import spawnAsync from '../util/spawnAsync'
import path from 'path'

require('dotenv').config()

asyncScript(async () => {
  const commitHash = (await execAsync('git rev-parse HEAD', {silent: true})).stdout.trim()
  await spawnAsync('docker-compose', ['up'], {
    env: {
      ...process.env,
      TAG: commitHash,
    },
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  })
})
