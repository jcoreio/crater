/* @flow */

import express from 'express'
import path from 'path'
import createSSR from './createSSR'
import { WebApp } from 'meteor/webapp'
import createDebug from 'debug'

const {BUILD_DIR} = process.env
if (!BUILD_DIR) throw new Error("missing process.env.BUILD_DIR")

const shutdownDebug = createDebug('crater:shutdown')

import '../universal/collections/Counts'

const app = express()

app.use((req: Object, res: Object, next: Function) => {
  if (/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(req.url)) {
    res.status(404).end()
  } else {
    next()
  }
})

// serve assets from meteor packages
app.use('/packages', express.static(path.resolve(BUILD_DIR, 'meteor', 'bundle', 'programs', 'web.browser', 'packages')))

if (process.env.NODE_ENV === 'production') {
  app.use('/static', express.static(path.resolve(__dirname, 'static')))
}
// istanbul ignore next
if (process.env.BABEL_ENV === 'test' || process.env.BABEL_ENV === 'coverage') {
  app.get('/shutdown', (req: Object, res: Object) => {
    try {
      if (process.env.BABEL_ENV === 'coverage') {
        const NYC = require('nyc')
        new NYC().writeCoverageFile()
      }
    } catch (error) {
      console.error(error.stack) // eslint-disable-line no-console
    }
    setTimeout(shutdown, 1000)
    res.status(200).send('shutting down...')
  })
}

// server-side rendering
app.get('*', (req: Object, res: Object, next: Function) => {
  // let Meteor handle sockjs requests so that DDP works
  // and OAuth requests as well
  if (/^\/(sockjs|_?oauth)/.test(req.path)) {
    next()
    return
  }
  createSSR(req, res)
})

WebApp.rawConnectHandlers.use(app)
WebApp.onListening(() => {
  console.log(`App is listening on http://0.0.0.0:${process.env.WEBPACK_PORT || process.env.PORT || '80'}`) // eslint-disable-line no-console
})

function shutdown() {
  shutdownDebug('got signal, shutting down')
  try {
    WebApp.httpServer.close()
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

