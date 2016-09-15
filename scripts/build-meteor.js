#!/usr/bin/env babel-node
// @flow

import path from 'path'
import glob from 'glob'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import asyncScript from './util/asyncScript'
import isNewerThan from './util/isNewerThan'
import spawnAsync from './util/spawnAsync'
import promisify from 'es6-promisify'

const root = path.resolve(__dirname, '..')
const meteor = path.join(root, 'meteor')
const build = path.join(root, 'build')

async function buildMeteor(): Promise<void> {
  await promisify(mkdirp)(build)
  if (await isNewerThan([
    ...await promisify(glob)(path.join(meteor, '**')),
    path.join(meteor, '.meteor', 'packages'),
    path.join(meteor, '.meteor', 'platforms'),
    path.join(meteor, '.meteor', 'release'),
    path.join(meteor, '.meteor', 'versions'),
  ], path.join(build, 'meteor'))) {
    console.log('building Meteor packages...')
    await promisify(rimraf)(path.join(build, 'meteor'))
    await spawnAsync('meteor', ['build', path.join('..', 'build', 'meteor'), '--directory'], {
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
