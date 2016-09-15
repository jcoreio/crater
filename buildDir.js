var path = require('path')

module.exports = path.resolve(__dirname, 'build')

// to support a multitarget build, use the following:
// module.exports = path.resolve(__dirname, 'build', process.env.TARGET || 'default')
