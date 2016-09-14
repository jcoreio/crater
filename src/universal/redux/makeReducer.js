// @flow

import {combineReducers} from 'redux-immutablejs'
import {routerReducer} from 'react-router-redux'
import type {Reducer} from '../flowtypes/redux'

const currentReducers: {[key: string]: Reducer} = {
  router: routerReducer,
}

export default (newReducers?: {[key: string]: Reducer} = {}): Reducer => {
  Object.assign(currentReducers, newReducers)
  return combineReducers(currentReducers)
}
