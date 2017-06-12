#!/usr/bin/env babel-node
// @flow

import asyncScript from 'crater-util/lib/asyncScript'
import execAsync from 'crater-util/lib/execAsync'
import spawnAsync from 'crater-util/lib/spawnAsync'
import dockerEnv from 'crater-util/lib/dockerEnv'
import path from 'path'
import build from './build'
import requireEnv from '../requireEnv'

const root = path.resolve(__dirname, '..')

async function buildDocker(): Promise<void> {
  const BUILD_DIR = requireEnv('BUILD_DIR')

  const opts = {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...await dockerEnv(),
    }
  }

  await build()
  const commitHash = (await execAsync('git rev-parse HEAD', {silent: true})).stdout.trim()
  const {TARGET} = process.env
  const tag = `jedwards1211/crater${TARGET ? '-' + TARGET : ''}:${commitHash}`
  await spawnAsync('docker', [
    'build',
    '--build-arg', `BUILD_DIR=${path.relative(root, BUILD_DIR)}`,
    '--build-arg', `TARGET=${TARGET || ''}`,
    '-t', tag,
    root
  ], opts)
}

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(buildDocker)
}
