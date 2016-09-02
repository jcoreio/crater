import React from 'react'
import {createStore, applyMiddleware} from 'redux'
import makeReducer from '../universal/redux/makeReducer'
import {match} from 'react-router'
import Html from './Html'
import {push} from 'react-router-redux'
import {renderToStaticMarkup} from 'react-dom-stream/server'
import fs from 'fs'
import {join, basename} from 'path'
import promisify from 'es6-promisify'
import {Map as iMap} from 'immutable'
import {Meteor} from 'meteor/meteor'

const __meteor_runtime_config__ = {
  PUBLIC_SETTINGS: {},
  ROOT_URL: process.env.ROOT_URL,
  ROOT_URL_PATH_PREFIX: '',
  meteorEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  meteorRelease: Meteor.release,
}

// https://github.com/systemjs/systemjs/issues/953

function renderApp(res, store, assets, renderProps) {
  const location = renderProps && renderProps.location && renderProps.location.pathname || '/'
  // Needed so some components can render based on location
  store.dispatch(push(location))
  const htmlStream = renderToStaticMarkup(
    <Html
      title="Crater"
      store={store}
      assets={assets}
      __meteor_runtime_config__={__meteor_runtime_config__}
      renderProps={renderProps}
    />
  )
  res.write('<!DOCTYPE html>')
  htmlStream.pipe(res, {end: false})
  htmlStream.on('end', () => res.end())
}

async function createSSR(req, res) {
  try {
    const store = createStore(makeReducer(), iMap())
    if (process.env.NODE_ENV === 'production') {
      const makeRoutes = require('../prerender').default
      const assets = require('../assets.json')
      const readFile = promisify(fs.readFile)
      assets.manifest.text = await
      readFile(join(__dirname, '..', assets.manifest.js), 'utf-8')
      const routes = makeRoutes(store)
      match({routes, location: req.url}, (error, redirectLocation, renderProps) => {
        if (error) {
          res.status(500).send(error.message)
        } else if (redirectLocation) {
          res.redirect(redirectLocation.pathname + redirectLocation.search)
        } else if (renderProps) {
          renderApp(res, store, assets, renderProps)
        } else {
          res.status(404).send('Not found')
        }
      })
    } else {
      // just send a cheap html doc + stringified store
      renderApp(res,  store)
    }
  } catch (error) {
    console.error(error.stack)
  }
}

export default createSSR
