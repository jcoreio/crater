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
  // suppress compression middleware in meteor/webapp, which comes before rawConnectHandlers
  // and interferes with webpack-hot-middleware (hopefully they'll accept my PR to move it after rawConnectHandlers)
  // https://github.com/meteor/meteor/issues/7754
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-transform')
    next()
  })
  const webpackConfig = require('../../webpack/webpack.config.dev').default
  const compiler = require('webpack')(webpackConfig)
  app.use(require('webpack-dev-middleware')(compiler, webpackConfig.devServer || {}))
  app.use(require('webpack-hot-middleware')(compiler))
}

app.get('*', (req, res, next) => {
  const {pathname} = url.parse(req.url)
  // let sockjs requests fall through to Meteor's handlers for DDP
  if (pathname.startsWith('/sockjs')) {
    next()
    return
  }
  // otherwise render a page for the given location
  createSSR(req, res)
})

WebApp.rawConnectHandlers.use(app)

console.log(`App is listening on http://0.0.0.0:${process.env.PORT}`)
