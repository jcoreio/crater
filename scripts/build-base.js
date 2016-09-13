#!/usr/bin/env babel-node

import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import asyncScript from '../util/asyncScript'
import isNewerThan from '../util/isNewerThan'
import spawnAsync from '../util/spawnAsync'
import promisify from 'es6-promisify'

process.on('SIGINT', () => process.exit(1))

const root = path.resolve(__dirname, '..')
const build = path.join(root, 'build')

asyncScript(async () => {
  await promisify(mkdirp)(build)
  await spawnAsync('babel', [path.join(root, 'src', 'index.js'), '-o', path.join(build, 'index.js')], {stdio: 'inherit'})
  if (await isNewerThan(path.join(root, 'meteor'), path.join(build, 'meteor'))) {
    console.log('building Meteor packages...')
    await promisify(rimraf)(path.join(build, 'meteor'))
    await spawnAsync('meteor', ['build', path.join('..', 'build', 'meteor'), '--directory'], {
      cwd: path.resolve(__dirname, '..', 'meteor'),
      stdio: 'inherit'
    })
  } else {
    console.log('build/meteor is up to date')
  }
})
