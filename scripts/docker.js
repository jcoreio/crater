#!/usr/bin/env babel-node
// @flow

import asyncScript from 'crater-util/lib/asyncScript'
import execAsync from 'crater-util/lib/execAsync'
import spawnAsync from 'crater-util/lib/spawnAsync'
import path from 'path'

const root = path.resolve(__dirname, '..')

asyncScript(async (): Promise<any> => {
  const commitHash = (await execAsync('git rev-parse HEAD', {silent: true})).stdout.trim()
  const {TARGET} = process.env
  const NAME = `crater${TARGET ? '-' + TARGET : ''}`
  await spawnAsync('docker-compose', ['up'], {
    env: {
      ...process.env,
      NAME,
      ROOT_URL: 'http://localhost:3000',
      TAG: commitHash,
    },
    cwd: root,
    stdio: 'inherit',
  })
})
