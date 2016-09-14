// @flow

import fs from 'fs'
import type {Stats} from 'fs'

function isDirectory(path: string): Promise<boolean> {
  return new Promise((resolve: (result: boolean) => any) => {
    fs.stat(path, (err: ?Error, stats: ?Stats) => {
      resolve(err || stats == null ? false : stats.isDirectory())
    })
  })
}

export default isDirectory
