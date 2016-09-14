#!/usr/bin/env babel-node

import start from './start'
import spawn from '../util/spawn'

process.on('SIGINT', () => process.exit(1))

start({
  supervisorOpts: ['--debug-brk'],
})
spawn('node-inspector', [], { stdio: 'inherit' })
