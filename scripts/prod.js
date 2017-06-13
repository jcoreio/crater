#!/usr/bin/env babel-node
// @flow

import launch from 'smart-restart'
import asyncScript from 'crater-util/lib/asyncScript'
import spawnAsync from 'crater-util/lib/spawnAsync'
import buildMeteor from './build-meteor'
import installMeteorDeps from './installMeteorDeps'
import path from 'path'
import webpack from 'webpack'
import clientConfig from '../webpack/webpack.config.prod'
import serverConfig from '../webpack/webpack.config.server'
import requireEnv from '../requireEnv'

const root = path.resolve(__dirname, '..')

async function prod(options?: {commandOptions?: Array<string>} = {}): Promise<any> {
  const BUILD_DIR = requireEnv('BUILD_DIR')
  await buildMeteor()
  await installMeteorDeps()
  await spawnAsync('babel', [path.join(root, 'src', 'index.js'), '-o', path.join(BUILD_DIR, 'index.js')], {
    cwd: root,
    stdio: 'inherit',
  })

  function launchWebpack(config: Object): Promise<void> {
    return new Promise((_resolve: Function) => {
      let resolved = false
      function resolve() {
        if (!resolved) {
          resolved = true
          _resolve()
        }
      }
      const compiler = webpack(config)
      compiler.watch({}, (err: ?Error, stats: Object) => {
        if (err) {
          console.error(err.stack)
          return
        }
        process.stdout.write(stats.toString({
          colors: true,
          modules: false,
          chunkModules: false,
          chunks: true,
          errorDetails: true,
        }) + "\n")
        if (stats.toJson().errors.length) return
        resolve()
      })
    })
  }

  await Promise.all([launchWebpack(serverConfig), launchWebpack(clientConfig)])

  launch({
    main: path.join(BUILD_DIR, 'index.js'),
    commandOptions: options.commandOptions || [],
  })
}

export default prod

if (!module.parent) {
  require('./addSignalHooks')
  asyncScript(prod, {exitOnSuccess: false})
}

