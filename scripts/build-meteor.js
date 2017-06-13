#!/usr/bin/env babel-node
// @flow

import path from 'path'
import glob from 'glob'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import asyncScript from 'crater-util/lib/asyncScript'
import isNewerThan from 'crater-util/lib/isNewerThan'
import spawnAsync from 'crater-util/lib/spawnAsync'
import promisify from 'es6-promisify'
import requireEnv from '../requireEnv'
const root = path.resolve(__dirname, '..')
const meteor = path.join(root, 'meteor')

async function buildMeteor(): Promise<void> {
  const BUILD_DIR = requireEnv('BUILD_DIR')
  await promisify(mkdirp)(BUILD_DIR)
  if (await isNewerThan(
    path.join(meteor, 'package.json'),
    path.join(meteor, 'node_modules'),
    )) {
    console.log('installing meteor/node_modules...')
    await spawnAsync('npm', ['install'], {
      cwd: meteor,
      stdio: 'inherit'
    })
  } else {
    console.log('meteor/node_modules is up to date')
  }
  if (await isNewerThan([
    ...await promisify(glob)(path.join(meteor, '**')),
    path.join(meteor, '.meteor', 'packages'),
    path.join(meteor, '.meteor', 'platforms'),
    path.join(meteor, '.meteor', 'release'),
    path.join(meteor, '.meteor', 'versions'),
  ], path.join(BUILD_DIR, 'meteor'))) {
    console.log('building Meteor packages...')
    await promisify(rimraf)(path.join(BUILD_DIR, 'meteor'))
    await spawnAsync('meteor', ['build', path.join(path.relative(meteor, BUILD_DIR), 'meteor'), '--directory'], {
      cwd: meteor,
      stdio: 'inherit'
    })
  } else {
    console.log('build/meteor is up to date')
  }
}

export default buildMeteor

if (!module.parent) {
  require('./addSignalHooks')
  asyncScript(buildMeteor)
}
