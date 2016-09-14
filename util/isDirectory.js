import fs from 'fs'

function isDirectory(path) {
  return new Promise(resolve => {
    fs.stat(path, (err, stats) => {
      resolve(err ? false : stats.isDirectory())
    })
  })
}

export default isDirectory
