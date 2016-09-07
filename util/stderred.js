import streamed from './streamed'

async function stderred(child, predicate, timeout) {
  return streamed(child, child.stderr, predicate, timeout)
}

export default stderred
