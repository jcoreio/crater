function shutdown() {
  if (process.env.BABEL_ENV === 'coverage') {
    try {
      const NYC = require('nyc')
      new NYC().writeCoverageFile()
      console.log('wrote coverage file')
    } catch (error) {
      console.error(error.stack) // eslint-disable-line no-console
    }
  }
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

