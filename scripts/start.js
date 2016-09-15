#!/usr/bin/env babel-node
// @flow

import asyncScript from './util/asyncScript'
import {run as supervisor} from 'supervisor'
import path from 'path'
import buildMeteor from './build-meteor'
import installMeteorDeps from './installMeteorDeps'

process.env.NODE_ENV = 'development'
process.env.USE_DOTENV = '1'

const root = path.resolve(__dirname, '..')
const src = path.join(root, 'src')

async function start(options?: {supervisorOpts?: Array<any>} = {}): Promise<any> {
  await buildMeteor()
  await installMeteorDeps()
  require('./devServer')
  supervisor([
    ...options.supervisorOpts || [],
    '-w', path.resolve(src, 'server'), path.join(src, 'universal'), path.join(src, 'index.js')
  ])
}

export default start

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(start, {
    exitOnSuccess: false,
  })
}

