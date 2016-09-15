// @flow

import spawn from './spawn'
import join from './join'
import type {Result} from './join'

function spawnAsync(command: string, args?: Array<string> = [], options?: Object = {}): Promise<Result> {
  const {timeout, ...otherOptions} = options
  return join(spawn(command, args, {stdio: options.silent ? 'pipe' : 'inherit', ...otherOptions}), timeout)
}

export default spawnAsync
