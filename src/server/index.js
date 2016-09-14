import express from 'express'
import path from 'path'
import createSSR from './createSSR'
import { WebApp } from 'meteor/webapp'

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
  app.use('/static', express.static(path.resolve(__dirname, 'static')))
}

// server-side rendering
app.get('*', (req, res, next) => {
  // let Meteor handle sockjs requests so that DDP works
  if (/^\/sockjs/.test(req.path)) {
    next()
    return
  }
  return createSSR(req, res)
})

WebApp.rawConnectHandlers.use(app)

console.log(`App is listening on http://0.0.0.0:${process.env.PORT}`) // eslint-disable-line no-console
