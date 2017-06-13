// @flow

exports.NODE_ENV = 'development'
exports.BUILD_DIR = require('./buildDir')
exports.PORT = process.env.PORT || '3000'
exports.WEBPACK_PORT = process.env.WEBPACK_PORT || '4000'
exports.WEBPACK_DEVTOOL = 'eval'
exports.ROOT_URL = 'http://localhost:' + exports.WEBPACK_PORT
exports.MONGO_DATABASE = process.env.MONGO_DATABASE || 'crater'
exports.MONGO_URL = 'mongodb://localhost:27017/' + exports.MONGO_DATABASE
exports.METEOR_SETTINGS = '{"public": {"test": "success"}}'

