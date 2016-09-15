/* @flow */

import { createStore, applyMiddleware, compose } from 'redux'
import { Map as iMap } from 'immutable'
import { routerMiddleware } from 'react-router-redux'
import { browserHistory } from 'react-router'
import makeReducer from '../universal/redux/makeReducer'
import type {Store} from '../universal/flowtypes/redux'

export default (initialState: iMap<string, any>): Store => {
  let store
  const reducer = makeReducer()
  const reduxRouterMiddleware = routerMiddleware(browserHistory)
  const middlewares = [
    reduxRouterMiddleware,
  ]

  if (process.env.NODE_ENV === 'production') {
    store = createStore(reducer, initialState, applyMiddleware(...middlewares))
  } else {
    const devtoolsExt = global.devToolsExtension && global.devToolsExtension()
    if (!devtoolsExt) {
      // We don't have the Redux extension in the browser, show the Redux logger
      const createLogger = require('redux-logger')
      const logger = createLogger({
        level: 'info',
        collapsed: true,
      })
      middlewares.push(logger)
    }
    store = createStore(reducer, initialState, compose(
      applyMiddleware(...middlewares),
      devtoolsExt || ((f: any): any => f)
    ))
  }
  return store
}
