import terminate from 'terminate'

async function kill(child, signal, timeout) {
  if (typeof signal === 'number') {
    timeout = signal
    signal = undefined
  }
  return new Promise((_resolve, _reject) => {
    let timeoutId, ignoreResult
    function unlisten() {
      ignoreResult = true
      if (timeoutId != null) clearTimeout(timeoutId)
      child.removeListener('exit', resolve)
      child.removeListener('error', reject)
    }
    function resolve() {
      unlisten()
      _resolve()
    }
    function reject(error) {
      unlisten()
      _reject(error)
    }
    child.on('exit', resolve)
    child.on('error', reject)
    if (timeout) setTimeout(() => reject(new Error('kill timed out')), timeout)
    if (signal) child.kill(signal)
    else terminate(child.pid)
  })
}

export default kill
