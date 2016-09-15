#!/usr/bin/env babel-node
// @flow

import phantomjs from 'phantomjs-prebuilt'
import asyncScript from './util/asyncScript'
import killOnExit from './util/killOnExit'
import spawnAsync from './util/spawnAsync'
import path from 'path'

import type {ChildProcess} from 'child_process'

const opts = {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit'
}

phantomjs.run('--webdriver=4444').then((program: ChildProcess) => {
  killOnExit(program)
  console.log('Started PhantomJS.')

  asyncScript(async (): Promise<void> => {
    const {code, signal} = await spawnAsync('node_modules/.bin/wdio', [...process.argv.slice(2), 'wdio.conf.js'], opts)
    if ((code != null && code > 0) || signal != null) throw new Error("test exited with: ", {code, signal})
  })
})
