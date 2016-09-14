import streamed from './streamed'

function stdouted(child, predicate, timeout) {
  return streamed(child, child.stdout, predicate, timeout)
}

export default stdouted
