import getMaxMtime from './getMaxMtime'

/*
 * This is basically an implementation of the bash `-nt` operator.
 * Resolves to `true` iff `path1` is newer than that at `path2` (or `path2` doesn't exist).
 * If a directory path is given, takes the maximum `mtime` of all files/directories within it.
 */
function isNewerThan(path1, path2) {
  return new Promise(async (resolve, reject) => {
    getMaxMtime(path1).catch(reject).then(mtime1 => {
      getMaxMtime(path2).catch(() => resolve(true)).then(mtime2 => resolve(mtime1 > mtime2))
    })
  })
}

export default isNewerThan
