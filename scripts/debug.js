#!/usr/bin/env babel-node
// @flow

import start from './start'
import spawn from 'crater-util/lib/spawn'
import path from 'path'

process.on('SIGINT', (): any => process.exit(1))

start({
  commandOptions: ['--debug'],
})
spawn('node-inspector', [], {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
