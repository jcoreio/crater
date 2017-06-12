// @flow

var path = require('path')
module.exports = path.resolve(__dirname, '..', 'build')
if (process.env.TARGET) module.exports = path.resolve(module.exports, process.env.TARGET)

