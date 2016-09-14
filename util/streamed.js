// @flow

import type {ChildProcess} from 'child_process'
import type {Readable} from 'stream'

function streamed(
  child: ChildProcess,
  stream: Readable,
  predicate: (output: string) => boolean | RegExp,
  timeout?: number
): Promise<string> {
  return new Promise((_resolve: Function, _reject: Function) => {
    let timeoutId

    function unlisten() {
      if (timeoutId != null) clearTimeout(timeoutId)
      stream.removeListener('data', onData)
      child.removeListener('close', onClose)
      child.removeListener('exit', onExit)
      child.removeListener('error', reject)
    }

    function resolve(data: string) {
      unlisten()
      _resolve(data)
    }

    function reject(error: Error) {
      unlisten()
      _reject(error)
    }

    function onData(data: Buffer) {
      const message = data.toString()
      if (predicate instanceof RegExp ? predicate.test(message) : predicate(message)) resolve(data.toString())
    }

    const onClose = (): any => reject(new Error('stream closed'))
    const onExit = (): any => reject(new Error('process exited'))
    child.on('error', reject)
    child.on('exit', onExit)
    child.on('close', onClose)
    stream.on('data', onData)
    if (timeout) timeoutId = setTimeout((): any => reject(new Error('waitForStream timed out')), timeout)
  })
}

export default streamed
