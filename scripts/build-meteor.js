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
import buildDir from '../buildDir'
import fs from 'fs'

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
    console.log(await promisify(fs.readFile)(
      path.join(buildDir, 'meteor', 'bundle', 'programs', 'server', 'npm-rebuilds.json'), 'utf8')
    )
    console.log(await promisify(glob)(path.join(buildDir, '**')))
  } else {
    console.log('build/meteor is up to date')
  }
}

export default buildMeteor

if (!module.parent) {
  process.on('SIGINT', (): any => process.exit(1))
  asyncScript(buildMeteor)
}
