// @flow

import kill from './kill'

import type {ChildProcess} from 'child_process'

export default function killOnExit(child: ChildProcess) {
  let exited = false
  child.on('exit', (): any => exited = true)
  process.on('exit', (): any => exited || kill(child))
  process.on('SIGINT', (): any => exited || kill(child))
  process.on('SIGTERM', (): any => exited || kill(child))
}
