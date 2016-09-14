import streamed from './streamed'

function stderred(child, predicate, timeout) {
  return streamed(child, child.stderr, predicate, timeout)
}

export default stderred
