#!/usr/bin/env babel-node

import start from './start'
import spawn from '../util/spawn'
import path from 'path'

process.on('SIGINT', () => process.exit(1))

start({
  supervisorOpts: ['--debug'],
})
spawn('node-inspector', [], {cwd: path.resolve(__dirname, '..'), stdio: 'inherit'})
