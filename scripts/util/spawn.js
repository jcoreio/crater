// @flow

import path from 'path'
import {spawn as _spawn} from 'cross-spawn'
import killOnExit from './killOnExit'

import type {ChildProcess} from 'child_process'

export default function spawn(command: string, args?: Array<string> = [], options?: Object = {}): ChildProcess {
  const {silent, ...otherOptions} = options
  const child = _spawn(command, args, {
    cwd: path.resolve(__dirname, '..'),
    ...otherOptions,
  })
  if (child.stdin) process.stdin.pipe(child.stdin)
  if (!silent) {
    if (child.stdout) child.stdout.pipe(process.stdout)
    if (child.stderr) child.stderr.pipe(process.stderr)
  }
  killOnExit(child)
  return child
}
