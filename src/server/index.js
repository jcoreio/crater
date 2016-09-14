/* @flow */

import express from 'express'
import path from 'path'
import createSSR from './createSSR'
import { WebApp } from 'meteor/webapp'

import '../universal/collections/Counts'

const app = express()

app.use((req: Object, res: Object, next: Function) => {
  if (/\/favicon\.?(jpe?g|png|ico|gif)?$/i.test(req.url)) {
    res.status(404).end()
  } else {
    next()
  }
})

if (process.env.NODE_ENV === 'production') {
  app.use('/static', express.static(path.resolve(__dirname, 'static')))
}

// server-side rendering
app.get('*', (req: Object, res: Object, next: Function) => {
  // let Meteor handle sockjs requests so that DDP works
  if (/^\/sockjs/.test(req.path)) {
    next()
    return
  }
  createSSR(req, res)
})

WebApp.rawConnectHandlers.use(app)

if (process.env.PORT != null) {
  console.log(`App is listening on http://0.0.0.0:${process.env.PORT}`) // eslint-disable-line no-console
}
