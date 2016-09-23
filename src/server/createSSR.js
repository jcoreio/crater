import React from 'react'
import {createStore} from 'redux'
import makeReducer from '../universal/redux/makeReducer'
import {match} from 'react-router'
import Html from './Html'
import {push} from 'react-router-redux'
import {renderToStaticMarkup} from 'react-dom-stream/server'
import fs from 'fs'
import path from 'path'
import {join} from 'path'
import promisify from 'es6-promisify'
import {Map as iMap} from 'immutable'
import {Meteor} from 'meteor/meteor'
import url from 'url'
import type {IncomingMessage, ServerResponse} from 'http'
import type {Store} from '../universal/flowtypes/redux'
import Fiber from 'fibers'

const __meteor_runtime_config__ = {
  PUBLIC_SETTINGS: Meteor.settings.public || {},
  ROOT_URL: process.env.ROOT_URL,
  // Not everything is in place to support basename right now (e.g. react-router history config, webpack config)
  // but might as well go ahead and use the correct value here anyway
  ROOT_URL_PATH_PREFIX: url.parse(process.env.ROOT_URL).pathname.substring(1),
  meteorEnv: {
    NODE_ENV: process.env.NODE_ENV,
  },
  meteorRelease: Meteor.release,
}

function renderApp(res: ServerResponse, store: Store, assets?: Object, renderProps?: Object) {
  Fiber(() => Meteor.bindEnvironment(() => {
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
    htmlStream.on('end', (): void => res.end())
  })()).run()
}

async function createSSR(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const store = createStore(makeReducer(), iMap())
    if (process.env.NODE_ENV === 'production') {
      const readFile = promisify(fs.readFile)
      const assets = JSON.parse(await readFile(path.resolve(__dirname, 'assets.json'), 'utf8'))
      assets.manifest.text = await
      readFile(join(__dirname, assets.manifest.js), 'utf-8')
      if (process.env.DISABLE_FULL_SSR) {
        return renderApp(res, store, assets)
      }
      const makeRoutes = require('../universal/routes').default
      const routes = makeRoutes(store)
      match({routes, location: req.url}, (error: ?Error, redirectLocation: {pathname: string, search: string}, renderProps: ?Object) => {
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
    console.error(error.stack) // eslint-disable-line no-console
  }
}

export default createSSR
