import fs from 'fs'
import path from 'path'
import promisify from 'es6-promisify'
import glob from 'glob'
import mkdirp from 'mkdirp'
import {transformFile} from 'babel-core'

;(async () => {
  try {
    const shimDir = path.join(__dirname, 'build/server/shims')
    await promisify(mkdirp)(shimDir)

    let files = await promisify(glob)('src/**/*.js')
    files = files.filter(file => !/^src\/server\/shims/.test(file) && !/^src\/client/.test(file))
    await Promise.all(files.map(async file => {
      const {code} = await promisify(transformFile)(file, {
        resolveModuleSource(source) {
          const match = /^meteor\/(.*)/.exec(source)
          if (match) {
            const shimFile = path.join(shimDir, match[1] + '.js')
            let exists
            try {
              exists = fs.statSync(shimFile).isFile()
            } catch (err) {
              // ignore
            }
            if (!exists) fs.writeFileSync(shimFile, 'module.exports = Package.' + match[1].replace(/\//g, '.'))
            return shimFile
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
