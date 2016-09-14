// @flow

import getMaxMtime from './getMaxMtime'

/*
 * This is basically an implementation of the bash `-nt` operator.
 * Resolves to `true` iff `path1` is newer than that at `path2` (or `path2` doesn't exist).
 * If a directory path is given, takes the maximum `mtime` of all files/directories within it.
 */
function isNewerThan(path1: string, path2: string): Promise<boolean> {
  return getMaxMtime(path1).then((mtime1: number): Promise<boolean> =>
    getMaxMtime(path2).catch((): any => true).then((mtime2: number): boolean => mtime1 > mtime2)
  )
}

export default isNewerThan
