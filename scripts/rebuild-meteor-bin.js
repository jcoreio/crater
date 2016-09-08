var glob = require('glob')
var spawnSync = require('child_process').spawnSync
var fs = require('fs')
var path = require('path')

var dirs = [
  fs.realpathSync(path.resolve(__dirname, '../meteor/.meteor/local/build/programs/server/node_modules'))
].concat(
  glob.sync(path.resolve(__dirname, '../meteor/.meteor/local/build/programs/server/npm/node_modules/**/node_modules'))
    .map(function (dir) { return fs.realpathSync(dir) })
)

dirs.forEach(function (dir) {
  spawnSync('npm', ['rebuild'], {
    cwd: dir,
    stdio: 'inherit',
  })
})
