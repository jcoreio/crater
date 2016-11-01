import React from 'react'
import makeStore from '../universal/redux/makeStore'
import {match as _match} from 'react-router'
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

function handleError(res: ServerResponse, error: Error) {
  console.error(error.stack) // eslint-disable-line no-console
  res.write(`
<div style="padding: 15px; position: fixed; top: 0; left: 0; right: 0; bottom: 0;">
  <h3>An internal server error occurred:</h3>
  <p>${error.message}</p>
</div>
`)
  res.addTrailers({
    'X-Streaming-Error': error.message,
  })
  res.end()
}

function renderApp(res: ServerResponse, store: Store, assets?: Object, renderProps?: Object) {
  res.setHeader('Trailer', 'X-Streaming-Error')

  const onError = handleError.bind(null, res)

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
      onError={onError}
    />
  )
  res.write('<!DOCTYPE html>')
  htmlStream.pipe(res, {end: false})
  htmlStream.on('end', (): void => res.end())
  htmlStream.on('error', onError)
}

type MatchResult = {
  redirectLocation: {pathname: string, search: string},
  renderProps: ?Object,
}

function match({routes, location}: {routes: Object, location: string}): Promise<MatchResult> {
  return new Promise((resolve: (result: MatchResult) => void, reject: (error: Error) => void) => {
    _match({routes, location}, (error: ?Error, redirectLocation: {pathname: string, search: string}, renderProps: ?Object) => {
      if (error) {
        reject(error)
        return
      }
      resolve({redirectLocation, renderProps})
    })
  })
}

const createSSR = Meteor.bindEnvironment(async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  try {
    const store = makeStore(iMap())
    if (process.env.NODE_ENV === 'production') {
      const readFile = promisify(fs.readFile)
      const assets = JSON.parse(await readFile(path.resolve(__dirname, 'assets.json'), 'utf8'))
      assets.manifest.text = await readFile(join(__dirname, assets.manifest.js), 'utf-8')
      if (process.env.DISABLE_FULL_SSR) {
        return await renderApp(res, store, assets)
      }
      const makeRoutes = require('../universal/routes').default
      const routes = makeRoutes(store)
      const {redirectLocation, renderProps} = await match({
        routes,
        location: req.url
      })
      if (redirectLocation) {
        res.redirect(redirectLocation.pathname + redirectLocation.search)
      } else if (renderProps) {
        renderApp(res, store, assets, renderProps)
      } else {
        res.status(404).send('Not found')
      }
    } else {
      // just send a cheap html doc + stringified store
      renderApp(res, store)
    }
  } catch (error) {
    handleError(res, error)
  }
})

export default createSSR
