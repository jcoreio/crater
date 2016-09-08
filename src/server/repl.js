/* eslint-disable no-console */

import repl from 'repl'
import vm from 'vm'
import replify from 'replify'
import path from 'path'
import {transform} from 'babel-core'

const transformOpts = {
  ...JSON.parse(require('fs').readFileSync(path.resolve(__dirname, '../../.babelrc'))),
  resolveModuleSource: require('./resolveModuleSource'),
}

replify({
  name: path.basename(path.resolve(__dirname, '../..')),
  start: options => repl.start({
    ...options,
    eval: function (cmd, context, filename, callback) {
      const {code} = transform(cmd, transformOpts)
      const _context = vm.createContext(context)

      // console.log(code)

      let result
      try {
        result = vm.runInContext(cmd, _context)
        // result = eval(code)
        // result
      }
      catch (e) {
        return callback(e)
      }
      callback(null, result)
    }
  })
})
