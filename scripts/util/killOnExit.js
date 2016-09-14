import kill from './kill'

export default function killOnExit(child) {
  let exited = false
  child.on('exit', () => exited = true)
  process.on('exit', () => exited || kill(child))
  process.on('SIGINT', () => exited || kill(child))
  process.on('SIGTERM', () => exited || kill(child))
}
