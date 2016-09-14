#!/usr/bin/env babel-node
// @flow

import path from 'path'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import asyncScript from '../util/asyncScript'
import isNewerThan from '../util/isNewerThan'
import spawnAsync from '../util/spawnAsync'
import promisify from 'es6-promisify'

const root = path.resolve(__dirname, '..')
const meteor = path.join(root, 'meteor')
const build = path.join(root, 'build')

async function buildMeteor(): Promise<void> {
  await promisify(mkdirp)(build)
  if (await isNewerThan(meteor, path.join(build, 'meteor'))) {
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
