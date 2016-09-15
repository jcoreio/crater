var path = require('path')

module.exports = path.resolve(__dirname, 'build', process.env.TARGET || 'default')
