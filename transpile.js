import fs from 'fs'
import path from 'path'
import promisify from 'es6-promisify'
import glob from 'glob'
import mkdirp from 'mkdirp'
import {transformFile} from 'babel-core'

;(async () => {
  try {
    const shimDir = path.resolve(__dirname, 'build/shims')
    await promisify(mkdirp)(shimDir)

    const files = [
      ...await promisify(glob)('src/server/**/*.js'),
      ...await promisify(glob)('src/universal/**/*.js'),
    ]
    await Promise.all(files.map(async file => {
      const {code} = await promisify(transformFile)(file, {
        resolveModuleSource(source, file) {
          const match = /^meteor\/(.*)/.exec(source)
          if (match) {
            const shimFile = path.join(shimDir, match[1] + '.js')
            fs.writeFileSync(shimFile, 'module.exports = Package.' + match[1].replace(/\//g, '.'))
            return path.relative(path.dirname(file), path.join(__dirname, 'src', 'shims', path.basename(shimFile)))
          }
          return source
        }
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
