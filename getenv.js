// @flow

require('dotenv').config({silent: true})
var path = require('path')

if (!process.env.BUILD_DIR) {
  process.env.BUILD_DIR = 'build'
  if (process.env.TARGET) process.env.BUILD_DIR = path.join(process.env.BUILD_DIR, process.env.TARGET)
}
process.env.BUILD_DIR = path.resolve(__dirname, process.env.BUILD_DIR)

var defaults = {
  PORT: '3000',
  ROOT_URL: 'http://localhost:3000',
  MONGO_URL: 'mongodb://localhost:27017/crater',
  METEOR_SETTINGS: '{"public": {"test": "success"}}',
}

for (var key in defaults) {
  if (process.env[key] == null) process.env[key] = defaults[key]
}

