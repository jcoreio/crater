#!/usr/bin/env babel-node
// @flow

import path from 'path'
import mkdirp from 'mkdirp'
import asyncScript from './util/asyncScript'
import isNewerThan from './util/isNewerThan'
import spawnAsync from './util/spawnAsync'
import webpack from 'webpack'
import webpackConfig from '../webpack/webpack.config.server'
import promisify from 'es6-promisify'

const root = path.resolve(__dirname, '..')
const build = path.join(root, 'build')
const prerender = path.join(build, 'prerender.js')

const opts = {cwd: root, stdio: 'inherit'}

async function buildServer(): Promise<void> {
  await promisify(mkdirp)(build)
  await spawnAsync('babel', [path.join(root, 'src', 'index.js'), '-o', path.join(build, 'index.js')], opts)
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
  } else {
    console.log('server assets are up to date')
  }
}

export default buildServer

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(buildServer)
}
