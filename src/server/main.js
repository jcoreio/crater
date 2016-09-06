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
  WebApp.rawConnectHandlers.use(app)
} else {
  const webpackConfig = require('../../webpack/webpack.config.dev').default
  const compiler = require('webpack')(webpackConfig)
  app.use(require('webpack-dev-middleware')(compiler, webpackConfig.devServer || {}))
  app.use(require('webpack-hot-middleware')(compiler))
  const server = app.listen(process.env.EXPRESS_PORT)

  const proxy = require('http-proxy').createProxyServer()
  proxy.on('error', (err) => console.error(err.stack))

  // proxy for Meteor DDP
  app.all('/sockjs/*', (req, res) => {
    const {pathname, query} = url.parse(req.url)
    proxy.web(req, res, {target: `http://localhost:${process.env.PORT}${pathname}?${query}`})
  })
  server.on('upgrade', (req, socket, head) => {
    if (/sockjs\/.*/.test(url.parse(req.url).pathname)) {
      proxy.ws(req, socket, head, {target: `http://localhost:${process.env.PORT}`})
    }
  })

  // redirect from meteor port to express port running this app
  const redirect = express()
  redirect.get('*', (req, res, next) => {
    if (/sockjs\/.*/.test(req.path)) {
      next()
      return
    }
    const target = {
      protocol: req.protocol,
      hostname: req.hostname,
      pathname: req.path,
      query: req.query,
      port: process.env.EXPRESS_PORT,
    }
    res.redirect(url.format(target))
  })
  WebApp.rawConnectHandlers.use(redirect)
}

// server-side rendering
app.get('*', (req, res, next) => {
  if (/sockjs\/.*/.test(req.path)) {
    next()
    return
  }
  return createSSR(req, res)
})

console.log(`App is listening on http://0.0.0.0:${process.env.PORT}`)
