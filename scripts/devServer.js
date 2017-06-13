// @flow

import express from 'express'
import webpackConfig from '../webpack/webpack.config.dev'
import createDebug from 'debug'
import requireEnv from '../requireEnv'

const shutdownDebug = createDebug('crater:shutdown')

const {BABEL_ENV} = process.env
const PORT = requireEnv('PORT')

const app = express()

const compiler = require('webpack')(webpackConfig)
app.use(require('webpack-dev-middleware')(compiler, webpackConfig.devServer || {}))
app.use(require('webpack-hot-middleware')(compiler))

const proxy = require('http-proxy').createProxyServer()
proxy.on('error', (err: Error): any => console.error(err.stack))

const target = `http://localhost:${PORT}`

// istanbul ignore next
function shutdown() {
  shutdownDebug('got signal, shutting down')
  try {
    server.close()
  } finally {
    process.exit(0)
  }
}

// istanbul ignore next
if (BABEL_ENV === 'coverage') {
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

// istanbul ignore next
if (BABEL_ENV === 'test' || BABEL_ENV === 'coverage') {
  app.get('/shutdown', async (req: Object, res: Object): any => {
    try {
      if (BABEL_ENV === 'coverage') {
        const NYC = require('nyc')
        new NYC().writeCoverageFile()
      }
    } catch (error) {
      console.error(error.stack) // eslint-disable-line no-console
    }
    try {
      await require('popsicle').get(`${target}/shutdown`)
    } catch (error) {
      console.error(error.stack) // eslint-disable-line no-console
    }
    setTimeout(shutdown, 1000)
    res.status(200).send('shutting down...')
  })
}

app.all('*', (req: Object, res: Object): any => proxy.web(req, res, { target }))

const server = app.listen(webpackConfig.devServer.port)

server.on('upgrade', (req: Object, socket: any, head: any): any => proxy.ws(req, socket, head, { target }))

console.log(`Dev server is listening on http://0.0.0.0:${webpackConfig.devServer.port}`)

