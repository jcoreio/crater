var path = require('path')
var fs = require('fs')

const shimDir = path.resolve(__dirname, '../shims')
try {
  fs.mkdirSync(shimDir)
} catch (err) {
  // ignore
}

// Custom babel resolver for importing Meteor packages
module.exports = function resolveModuleSource(source, file) {
  const match = /^meteor\/(.*)/.exec(source)
  if (match) {
    const shimFile = path.join(shimDir, match[1] + '.js')
    fs.writeFileSync(shimFile, 'module.exports = Package.' + match[1].replace(/\//g, '.'))
    return path.relative(path.dirname(file), shimFile)
  }
  return source
}
