// @flow

import streamed from './streamed'

import type {ChildProcess} from 'child_process'

function stderred(child: ChildProcess, predicate: (stdout: string) => boolean | RegExp, timeout?: number): Promise<string> {
  return streamed(child, child.stderr, predicate, timeout)
}

export default stderred
