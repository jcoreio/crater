#!/usr/bin/env babel-node

import spawn from '../util/spawn'
import path from 'path'

const env = {
  ...process.env,
  NODE_ENV: 'development',
  USE_DOTENV: 1,
}

const src = path.resolve(__dirname, '..', 'src')

export default function start(options = {}) {
  spawn('babel-node', [path.join(__dirname, 'devServer.js')], {env, stdio: 'inherit'})
  spawn('supervisor', [
    ...options.supervisorOpts || [],
    '-w', path.resolve(src, 'server'), path.join(src, 'universal'), path.join(src, 'index.js')
  ], {env, stdio: 'inherit'})
}

if (!module.parent) {
  process.on('SIGINT', () => process.exit(1))
  start()
}

