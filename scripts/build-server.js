#!/usr/bin/env babel-node
// @flow

import path from 'path'
import mkdirp from 'mkdirp'
import asyncScript from 'crater-util/lib/asyncScript'
import isNewerThan from 'crater-util/lib/isNewerThan'
import spawnAsync from 'crater-util/lib/spawnAsync'
import webpack from 'webpack'
import webpackConfig from '../webpack/webpack.config.server'
import promisify from 'es6-promisify'
import buildDir from '../buildDir'

const root = path.resolve(__dirname, '..')
const prerender = path.join(buildDir, 'prerender.js')

const opts = {cwd: root, stdio: 'inherit'}

async function buildServer(): Promise<void> {
  await promisify(mkdirp)(buildDir)
  await spawnAsync('babel', [path.join(root, 'src', 'index.js'), '-o', path.join(buildDir, 'index.js')], opts)
  if (await isNewerThan(path.join(root, 'webpack', 'webpack.config.server.js'), prerender) ||
      await isNewerThan(path.join(root, 'src'), prerender)) {
    console.log('building server bundle...')
    const compiler = webpack(webpackConfig)
    const stats = await promisify(compiler.run, compiler)()
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      chunkModules: false,
      chunks: true,
      errorDetails: true,
    }) + "\n")
    if (stats.toJson().errors.length) throw new Error("webpack build had errors")
  } else {
    console.log('server assets are up to date')
  }
}

export default buildServer

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(buildServer)
}
