import spawn from './spawn'
import join from './join'

async function spawnAsync(command, args = [], options = {}) {
  const {timeout, ...otherOptions} = options
  return join(spawn(command, args, {stdio: options.silent ? 'pipe' : 'inherit', ...otherOptions}), timeout)
}

export default spawnAsync
