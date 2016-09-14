// @flow

import terminate from 'terminate'

import type {ChildProcess} from 'child_process'

function kill(child: ChildProcess, signal?: string, timeout?: number): Promise<void> {
  if (typeof signal === 'number') {
    timeout = signal
    signal = undefined
  }
  return new Promise((_resolve: Function, _reject: Function) => {
    let timeoutId
    function unlisten() {
      if (timeoutId != null) clearTimeout(timeoutId)
      child.removeListener('exit', resolve)
      child.removeListener('error', reject)
    }
    function resolve() {
      unlisten()
      _resolve()
    }
    function reject(error: Error) {
      unlisten()
      _reject(error)
    }
    child.on('exit', resolve)
    child.on('error', reject)
    if (timeout) setTimeout((): any => reject(new Error('kill timed out')), timeout)
    if (signal) child.kill(signal)
    else terminate(child.pid)
  })
}

export default kill
