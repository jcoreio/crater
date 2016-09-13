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
    await spawnAsync('webpack', ['--config', path.join(root, 'webpack', 'prod.babel.js')], {stdio: 'inherit'})
  } else {
    console.log('build/static.js is up to date')
  }
})
