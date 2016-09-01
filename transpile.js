import fs from 'fs'
import path from 'path'
import promisify from 'es6-promisify'
import glob from 'glob'
import mkdirp from 'mkdirp'
import {transformFile} from 'babel-core'
import resolveModuleSource from './src/server/resolveModuleSource'

(async () => {
  try {
    const files = await promisify(glob)('src/**/*.js')
    await Promise.all(files.map(async file => {
      const {code} = await promisify(transformFile)(file, {
        resolveModuleSource
      })
      const outputFile = path.join(__dirname, 'build', file.substring(3))
      await promisify(mkdirp)(path.dirname(outputFile))
      await promisify(fs.writeFile)(outputFile, code)
      console.log(`${file} -> ${outputFile}`)
    }))
  } catch (err) {
    console.error(err.stack)
    process.exit(1)
  }
})()
