global.__CLIENT__ = false

if (process.env.USE_DOTENV) require('dotenv').config()

global.__PRODUCTION__ = process.env.NODE_ENV === 'production'

const path = require('path')

const buildDir = process.env.NODE_ENV === 'production' ? __dirname : require('../buildDir')

const cwd = process.cwd()

// I'm not super happy about this, but Meteor's boot.js seems to require being run from the directory it's in
const serverDir = path.join(buildDir, 'meteor', 'bundle', 'programs', 'server')
process.chdir(serverDir)
const argv = process.argv
process.argv = argv.slice(0, 2).concat('program.json') // .splice(2, 0, 'program.json')
// Launch the usual Meteor server
require(path.join(serverDir, 'boot.js'))
process.argv = argv
process.chdir(cwd)

if (process.env.NODE_ENV !== 'production') require('babel-register')

// eslint-disable-next-line no-undef
Package.meteor.Meteor.startup(() => {
  if (process.env.NODE_ENV === 'production') {
    require('./prerender')
  } else {
    require('./server/index')
  }
})
