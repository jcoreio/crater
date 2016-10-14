// @flow

import {exec} from 'child_process'

export type Result = {stdout: string, stderr: string}

function execAsync(command: string, options?: Object = {}): Promise<Result> {
  const {silent, ...otherOptions} = options
  return new Promise((resolve: Function, reject: Function) => {
    const child = exec(command, otherOptions, (error: ?Error, stdout: string | Buffer, stderr: string | Buffer) => {
      if (error) reject(error)
      else resolve({stdout: stdout.toString(), stderr: stderr.toString()})
    })
    process.stdin.pipe(child.stdin)
    if (!silent) {
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    }
  })
}

export default execAsync