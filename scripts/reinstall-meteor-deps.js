import asyncScript from '../util/asyncScript'
import spawnAsync from '../util/spawnAsync'
import fs from 'fs'
import path from 'path'
import isSymbolicLink from '../util/isSymbolicLink'
import promisify from 'es6-promisify'

const root = path.resolve(__dirname, '..')
const programsServer = path.join(root, 'meteor', '.meteor', 'local', 'build', 'programs', 'server')
const meteorModules = path.join(programsServer, 'node_modules')

async function reinstallMeteorDeps () {
  if (await isSymbolicLink(meteorModules)) await promisify(fs.unlink)(meteorModules)
  await spawnAsync('npm', ['install'], {cwd: programsServer, stdio: 'inherit'})
}

export default reinstallMeteorDeps

if (!module.parent) asyncScript(reinstallMeteorDeps)
