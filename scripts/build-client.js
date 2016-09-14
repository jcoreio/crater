#!/usr/bin/env babel-node

import path from 'path'
import asyncScript from '../util/asyncScript'
import isNewerThan from '../util/isNewerThan'
import spawnAsync from '../util/spawnAsync'

process.on('SIGINT', () => process.exit(1))

const root = path.resolve(__dirname, '..')

asyncScript(async () => {
  if (await isNewerThan(path.join(root, 'src'), path.join(root, 'build', 'static')) ||
      await isNewerThan(path.join(root, 'src'), path.join(root, 'build', 'assets.json'))) {
    console.log('building client bundle...')
    await spawnAsync('webpack', ['--config', path.join(root, 'webpack', 'prod.babel.js')], {stdio: 'inherit'})
  } else {
    console.log('client assets are up to date')
  }
})
