#!/usr/bin/env babel-node
// @flow

import asyncScript from './util/asyncScript'
import path from 'path'
import buildMeteor from './build-meteor'
import installMeteorDeps from './installMeteorDeps'
import launch from 'smart-restart'

process.env.NODE_ENV = 'development'
process.env.USE_DOTENV = '1'

const root = path.resolve(__dirname, '..')
const src = path.join(root, 'src')

async function start(options?: {commandOptions?: Array<any>} = {}): Promise<any> {
  if (process.argv.indexOf('--fast') < 0) {
    await buildMeteor()
    await installMeteorDeps()
  }
  require('./devServer')
  launch({
    commandOptions: options.commandOptions || [],
    main: path.join(src, 'index.js'),
  })
}

export default start

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(start, {
    exitOnSuccess: false,
  })
}

