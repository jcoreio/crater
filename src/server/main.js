import express from 'express'
import path from 'path'
import url from 'url'
import createSSR from './createSSR'
import {WebApp} from 'meteor/webapp'

import '../universal/collections/Counts'

const app = express()

app.use((req, res, next) => {
  if (/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(req.url)) {
    res.status(404).end()
  } else {
    next()
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use('/static', express.static(path.resolve(__dirname, '../static')))
} else {
  const webpackConfig = require('../../webpack/webpack.config.dev').default
  const compiler = require('webpack')(webpackConfig)
  app.use(require('webpack-dev-middleware')(compiler, webpackConfig.devServer || {}))
  app.use(require('webpack-hot-middleware')(compiler))
}

const {httpServer} = WebApp
const listeners = httpServer.listeners('request')
httpServer.removeAllListeners('request')

app.get('*', (req, res, next) => {
  const {pathname} = url.parse(req.url)
  if (pathname.startsWith('/sockjs')) {
    next()
    return
  }
  createSSR(req, res)
})
listeners.forEach(listener => app.use(listener))

httpServer.on('request', app)

console.log(`App is listening on http://0.0.0.0:${process.env.PORT}`)
