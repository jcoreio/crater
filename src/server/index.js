global.__CLIENT__ = false

if (process.env.USE_DOTENV) require('dotenv').config()

if (process.env.NODE_ENV === 'production' || require('piping')({
  hook: false,
  ignore: /(\/\.|~$|\.json$)/i
})) {
  var path = require('path')

  // I'm not super happy about this, but Meteor's boot.js seems to require being run from the directory it's in
  const serverDir = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../meteor/bundle/programs/server')
    : path.resolve(__dirname, '../../meteor/.meteor/local/build/programs/server')
  process.chdir(serverDir)
  var argv = process.argv
  process.argv = argv.slice(0, 2).concat('program.json') //.splice(2, 0, 'program.json')
  // Launch the usual Meteor server
  require(path.join(serverDir, 'boot.js'))
  process.argv = argv
  process.chdir(__dirname)

  if (process.env.NODE_ENV !== 'production') {
    require('babel-register')
  }

  Package.meteor.Meteor.startup(function () {
    require('./server')
  })
}
