// @flow

import fs from 'fs'
import glob from 'glob'
import path from 'path'
import promisify from 'es6-promisify'

async function getMaxMtime(p: string): Promise<number> {
  const files = await promisify(glob)(path.join(p, '**'), {dot: true})
  const mtimes = await Promise.all(files.map(async (file: String): Promise<Date> => (await promisify(fs.stat)(file)).mtime))
  return Math.max((await promisify(fs.stat)(p)).mtime, ...mtimes.map((date: Date): number => date.getTime()))
}

export default getMaxMtime
