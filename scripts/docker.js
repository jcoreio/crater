#!/usr/bin/env babel-node
// @flow

import asyncScript from 'crater-util/lib/asyncScript'
import spawnAsync from 'crater-util/lib/spawnAsync'
import dockerComposeEnv from './dockerComposeEnv'
import path from 'path'

const root = path.resolve(__dirname, '..')

asyncScript(async (): Promise<any> => {
  await spawnAsync('docker-compose', ['up'], {
    env: await dockerComposeEnv(),
    cwd: root,
    stdio: 'inherit',
  })
})
