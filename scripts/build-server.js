#!/usr/bin/env babel-node

import path from 'path'
import asyncScript from '../util/asyncScript'
import isNewerThan from '../util/isNewerThan'
import spawnAsync from '../util/spawnAsync'

process.on('SIGINT', () => process.exit(1))

const root = path.resolve(__dirname, '..')
const build = path.join(root, 'build')
const prerender = path.join(build, 'prerender.js')

asyncScript(async () => {
  await spawnAsync('babel', [path.join(root, 'src', 'index.js'), '-o', path.join(build, 'index.js')], {stdio: 'inherit'})
  if (await isNewerThan(path.join(root, 'webpack', 'webpack.config.server.js'), prerender) ||
      await isNewerThan(path.join(root, 'src'), prerender)) {
    console.log('building server bundle...')
    await spawnAsync('webpack', ['--config', path.join(root, 'webpack', 'server.babel.js')], {stdio: 'inherit'})
  } else {
    console.log('server assets are up to date')
  }
})
