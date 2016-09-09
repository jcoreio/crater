import express from 'express'
import url from 'url'
import webpackConfig from '../webpack/webpack.config.dev'

if (process.env.USE_DOTENV) require('dotenv').config()

const app = express()

const compiler = require('webpack')(webpackConfig)
app.use(require('webpack-dev-middleware')(compiler, webpackConfig.devServer || {}))
app.use(require('webpack-hot-middleware')(compiler))

const proxy = require('http-proxy').createProxyServer()
proxy.on('error', (err) => console.error(err.stack))

const target = `http://localhost:${process.env.PORT}`

app.all('*', (req, res) => proxy.web(req, res, {target}))

const server = app.listen(webpackConfig.devServer.port)
server.on('upgrade', (req, socket, head) => {
  if (/sockjs\/.*/.test(url.parse(req.url).pathname)) {
    proxy.ws(req, socket, head, {target})
  }
})

console.log(`Dev server is listening on http://0.0.0.0:${webpackConfig.devServer.port}`)
