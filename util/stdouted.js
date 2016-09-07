import streamed from './streamed'

async function stdouted(child, predicate, timeout) {
  return streamed(child, child.stdout, predicate, timeout)
}

export default stdouted
