global.__CLIENT__ = false

var path = require('path')

// load dev environment variables
require('dotenv').config()

if (process.env.NODE_ENV === 'production') {
  start()
} else {
  // piping restarts the server when any files change
  if (require('piping')({
    hook: false,
    ignore: /(\/\.|~$|\.json$)/i
  })) {
    start()
  }
}

function start() {
  // I'm not super happy about this, but Meteor's boot.js seems to require being run from the directory it's in
  const serverDir = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../meteor/bundle/programs/server')
    : path.resolve(__dirname, '../../meteor/.meteor/local/build/programs/server')
  process.chdir(serverDir)
  process.argv.splice(2, 0, 'program.json')
  // Launch the usual Meteor server
  require(path.join(serverDir, 'boot.js'))

  if (process.env.NODE_ENV !== 'production') {
    require('babel-register')({
      // this enables us to import Meteor packages
      resolveModuleSource: require('./resolveModuleSource')
    })
  }

  Package.meteor.Meteor.startup(function () {
    require('./main')
  })
}
