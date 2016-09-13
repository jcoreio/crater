import fs from 'fs'

async function isSymbolicLink(path) {
  return new Promise(resolve => {
    fs.lstat(path, (err, stats) => {
      resolve(err ? false : stats.isSymbolicLink())
    })
  })
}

export default isSymbolicLink
