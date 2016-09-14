function join(child, timeout) {
  return new Promise((_resolve, _reject) => {
    let timeoutId
    function unlisten() {
      if (timeoutId != null) clearTimeout(timeoutId)
      child.removeListener('exit', onExit)
      child.removeListener('error', reject)
    }
    function resolve(result) {
      unlisten()
      _resolve(result)
    }
    function reject(error) {
      unlisten()
      _reject(error)
    }
    const onExit = (code, signal) => resolve({code, signal})
    child.on('exit', onExit)
    child.on('error', reject)
    if (timeout) timeoutId = setTimeout(() => reject(new Error('join timed out')), timeout)
  })
}

export default join
