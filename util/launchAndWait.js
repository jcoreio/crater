import path from 'path'
import {spawn} from 'child_process'

async function launchAndWait(command, predicate, options = {}) {
  const parts = command.split(/\s+/g)
  return new Promise((resolve, reject) => {
    const child = spawn(parts[0], parts.slice(1), {
      cwd: path.resolve(__dirname, '..'),
      ...options,
    })
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('error', reject)
    child.stdout.on('data', data => {
      const message = data.toString()
      if (predicate instanceof RegExp ? predicate.test(message) : predicate(message)) resolve(child)
    })
    child.on('close', code => {
      if (code > 0) return reject(`'${command}' exited with code ${code}`)
    })
    const kill = () => child.kill()
    process.on('exit', kill)
    process.on('SIGINT', kill)
    process.on('SIGTERM', kill)
  })
}

export default launchAndWait