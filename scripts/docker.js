#!/usr/bin/env babel-node
// @flow

import asyncScript from '../util/asyncScript'
import execAsync from '../util/execAsync'
import spawnAsync from '../util/spawnAsync'
import path from 'path'

asyncScript(async (): Promise<any> => {
  const commitHash = (await execAsync('git rev-parse HEAD', {silent: true})).stdout.trim()
  await spawnAsync('docker-compose', ['up'], {
    env: {
      ...process.env,
      ROOT_URL: 'http://localhost:3000',
      TAG: commitHash,
    },
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  })
})
