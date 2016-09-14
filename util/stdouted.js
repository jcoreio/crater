// @flow

import streamed from './streamed'

import type {ChildProcess} from 'child_process'

function stdouted(child: ChildProcess, predicate: (stdout: string) => boolean | RegExp, timeout?: number): Promise<string> {
  return streamed(child, child.stdout, predicate, timeout)
}

export default stdouted
