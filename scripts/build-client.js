#!/usr/bin/env babel-node

import path from 'path'
import asyncScript from '../util/asyncScript'
import isNewerThan from '../util/isNewerThan'
import spawnAsync from '../util/spawnAsync'

process.on('SIGINT', () => process.exit(1))

const root = path.resolve(__dirname, '..')
const assets = path.join(root, 'build', 'assets.json')

asyncScript(async () => {
  if (await isNewerThan(path.join(root, 'webpack', 'webpack.config.prod.js'), assets) ||
      await isNewerThan(path.join(root, 'src'), assets)) {
    console.log('building client bundle...')
    await spawnAsync('webpack', ['--config', path.join(root, 'webpack', 'prod.babel.js')], {
      cwd: root,
      stdio: 'inherit',
    })
  } else {
    console.log('client assets are up to date')
  }
})
