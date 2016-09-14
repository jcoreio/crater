import path from 'path'
import child_process from 'child_process'
import killOnExit from './killOnExit'

export default function exec(command, options = {}) {
  const {silent, ...otherOptions} = options
  const child = child_process.exec(command, {
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
