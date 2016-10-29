#!/usr/bin/env babel-node
// @flow

import path from 'path'
import asyncScript from 'crater-util/lib/asyncScript'
import isNewerThan from 'crater-util/lib/isNewerThan'
import webpack from 'webpack'
import webpackConfig from '../webpack/webpack.config.prod'
import promisify from 'es6-promisify'
import buildDir from '../buildDir'

const root = path.resolve(__dirname, '..')
const assets = path.join(buildDir, 'assets.json')

async function buildClient(): Promise<void> {
  if (await isNewerThan(path.join(root, 'webpack', 'webpack.config.prod.js'), assets) ||
      await isNewerThan(path.join(root, 'src'), assets)) {
    console.log('building client bundle...')
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
    console.log('client assets are up to date')
  }
}

export default buildClient

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(buildClient)
}
