import path from 'path'
import {spawn} from 'child_process'

async function exec(command, options = {}) {
  const parts = command.split(/\s+/g)
  return new Promise((resolve, reject) => {
    const child = spawn(parts[0], parts.slice(1), {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      ...options,
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code > 0) return reject(`'${command}' exited with code ${code}`)
      resolve()
    })
    const kill = () => child.kill()
    process.on('exit', kill)
    process.on('SIGINT', kill)
    process.on('SIGTERM', kill)
  })
}

export default exec