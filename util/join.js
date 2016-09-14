// @flow

import type {ChildProcess} from 'child_process'

export type Result = {code: ?number, signal: ?string}

function join(child: ChildProcess, timeout?: number): Promise<Result> {
  return new Promise((_resolve: Function, _reject: Function) => {
    let timeoutId
    function unlisten() {
      if (timeoutId != null) clearTimeout(timeoutId)
      child.removeListener('exit', onExit)
      child.removeListener('error', reject)
    }
    function resolve(result: Result) {
      unlisten()
      _resolve(result)
    }
    function reject(error: Error) {
      unlisten()
      _reject(error)
    }
    const onExit = (code: ?number, signal: ?string): any => {
      if (code != null && code !== 0) reject(new Error(`process exited with code ${code}`))
      else resolve({code, signal})
    }
    child.on('exit', onExit)
    child.on('error', reject)
    if (timeout) timeoutId = setTimeout((): any => reject(new Error('join timed out')), timeout)
  })
}

export default join
