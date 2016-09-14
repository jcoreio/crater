import {exec} from 'child_process'

function execAsync(command, options = {}) {
  const {silent, ...otherOptions} = options
  return new Promise((resolve, reject) => {
    const child = exec(command, otherOptions, (error, stdout, stderr) => {
      if (error) reject(error)
      else resolve({stdout, stderr})
    })
    process.stdin.pipe(child.stdin)
    if (!silent) {
      child.stdout.pipe(process.stdout)
      child.stderr.pipe(process.stderr)
    }
  })
}

export default execAsync