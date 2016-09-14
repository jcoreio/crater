// @flow

import express from 'express'
import url from 'url'
import webpackConfig from '../webpack/webpack.config.dev'

if (process.env.USE_DOTENV) require('dotenv').config()
const {PORT} = process.env
if (PORT == null) throw new Error("Missing process.env.PORT")

const app = express()

const compiler = require('webpack')(webpackConfig)
app.use(require('webpack-dev-middleware')(compiler, webpackConfig.devServer || {}))
app.use(require('webpack-hot-middleware')(compiler))

const proxy = require('http-proxy').createProxyServer()
proxy.on('error', (err: Error): any => console.error(err.stack))

const target = `http://localhost:${PORT}`

app.all('*', (req: Object, res: Object): any => proxy.web(req, res, { target }))

const server = app.listen(webpackConfig.devServer.port)
server.on('upgrade', (req: Object, socket: any, head: any) => {
  const parsed = url.parse(req.url)
  if (parsed && parsed.pathname && /sockjs\/.*/.test(parsed.pathname)) {
    proxy.ws(req, socket, head, { target })
  }
})

console.log(`Dev server is listening on http://0.0.0.0:${webpackConfig.devServer.port}`)
