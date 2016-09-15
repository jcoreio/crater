#!/usr/bin/env babel-node
// @flow

import start from './start'
import spawn from './util/spawn'
import path from 'path'

process.on('SIGINT', (): any => process.exit(1))

start({
  supervisorOpts: ['--debug'],
})
spawn('node-inspector', [], {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
