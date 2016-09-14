#! /usr/bin/env babel-node
// @flow

import asyncScript from '../util/asyncScript'
import execAsync from '../util/execAsync'
import spawnAsync from '../util/spawnAsync'

const opts = {stdio: 'inherit'}

asyncScript(async (): Promise<any> => {
  await execAsync('clear', opts)
  await execAsync("printf '\\e[3J'", opts)
  await spawnAsync("npm", ['run', 'flow:0'], opts)
})
