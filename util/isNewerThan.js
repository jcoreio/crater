import fs from 'fs'

async function isNewerThan(path1, path2) {
  return new Promise((resolve, reject) => {
    fs.stat(path1, (err, stats1) => {
      if (err) return reject(err)
      fs.stat(path2, (err, stats2) => {
        return resolve(err ? true : stats1.mtime > stats2.mtime)
      })
    })
  })
}

export default isNewerThan
