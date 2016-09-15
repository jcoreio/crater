#!/usr/bin/env babel-node
// @flow

import asyncScript from './util/asyncScript'
import execAsync from './util/execAsync'
import spawnAsync from './util/spawnAsync'
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
