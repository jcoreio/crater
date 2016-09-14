function streamed(child, stream, predicate, timeout) {
  return new Promise((_resolve, _reject) => {
    let timeoutId

    function unlisten() {
      if (timeoutId != null) clearTimeout(timeoutId)
      stream.removeListener('data', onData)
      stream.removeListener('close', onClose)
      stream.removeListener('exit', onExit)
      stream.removeListener('error', reject)
    }

    function resolve(data) {
      unlisten()
      _resolve(data)
    }

    function reject(error) {
      unlisten()
      _reject(error)
    }

    function onData(data) {
      const message = data.toString()
      if (predicate instanceof RegExp ? predicate.test(message) : predicate(message)) resolve(data)
    }

    const onClose = () => reject(new Error('stream closed'))
    const onExit = () => reject(new Error('process exited'))
    child.on('error', reject)
    child.on('exit', onExit)
    child.on('close', onClose)
    stream.on('data', onData)
    if (timeout) timeoutId = setTimeout(() => reject(new Error('waitForStream timed out')), timeout)
  })
}

export default streamed
