#!/usr/bin/env babel-node
// @flow

import prod from './prod'
import spawn from 'crater-util/lib/spawn'
import path from 'path'

process.on('SIGINT', (): any => process.exit(1))

prod({
  commandOptions: ['--debug'],
})
spawn('node-inspector', [], {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
