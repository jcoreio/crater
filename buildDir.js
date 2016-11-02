// @flow

var buildDir = process.env.BUILD_DIR
if (!buildDir) throw new Error("missing process.env.BUILD_DIR")

module.exports = buildDir

