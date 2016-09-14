#!/usr/bin/env babel-node
// @flow

import start from './start'
import spawn from '../util/spawn'

process.on('SIGINT', (): any => process.exit(1))

start({
  supervisorOpts: ['--debug-brk'],
})
spawn('node-inspector', [], { stdio: 'inherit' })
