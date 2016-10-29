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
import buildDir from '../buildDir'

const root = path.resolve(__dirname, '..')
const meteor = path.join(root, 'meteor')

async function buildMeteor(): Promise<void> {
  await promisify(mkdirp)(buildDir)
  if (await isNewerThan([
    ...await promisify(glob)(path.join(meteor, '**')),
    path.join(meteor, '.meteor', 'packages'),
    path.join(meteor, '.meteor', 'platforms'),
    path.join(meteor, '.meteor', 'release'),
    path.join(meteor, '.meteor', 'versions'),
  ], path.join(buildDir, 'meteor'))) {
    console.log('building Meteor packages...')
    await promisify(rimraf)(path.join(buildDir, 'meteor'))
    await spawnAsync('meteor', ['build', path.join(path.relative(meteor, buildDir), 'meteor'), '--directory'], {
      cwd: meteor,
      stdio: 'inherit'
    })
  } else {
    console.log('build/meteor is up to date')
  }
}

export default buildMeteor

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(buildMeteor)
}
