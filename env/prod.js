// @flow

exports.NODE_ENV = 'production'
exports.BUILD_DIR = require('./buildDir')
exports.PORT = process.env.PORT || '3000'
exports.ROOT_URL = 'http://localhost:' + exports.PORT
exports.WEBPACK_DEVTOOL = 'source-map'
exports.MONGO_DATABASE = process.env.MONGO_DATABASE || 'crater'
exports.MONGO_URL = 'mongodb://localhost:27017/' + exports.MONGO_DATABASE
exports.METEOR_SETTINGS = '{"public": {"test": "success"}}'

