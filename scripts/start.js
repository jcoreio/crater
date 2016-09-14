#!/usr/bin/env babel-node

import asyncScript from '../util/asyncScript'
import spawn from '../util/spawn'
import path from 'path'
import buildMeteor from './build-meteor'
import installMeteorDeps from './installMeteorDeps'

const env = {
  ...process.env,
  NODE_ENV: 'development',
  USE_DOTENV: 1,
}

const root = path.resolve(__dirname, '..')
const src = path.join(root, 'src')

const opts = {cwd: root, env, stdio: 'inherit'}

async function start(options = {}) {
  await buildMeteor()
  await installMeteorDeps()
  spawn('babel-node', [path.join(__dirname, 'devServer.js')], opts)
  spawn('supervisor', [
    ...options.supervisorOpts || [],
    '-w', path.resolve(src, 'server'), path.join(src, 'universal'), path.join(src, 'index.js')
  ], opts)
}

export default start

if (!module.parent) {
  process.on('SIGINT', () => process.exit(1))
  asyncScript(start, {
    exitOnSuccess: false,
  })
}

