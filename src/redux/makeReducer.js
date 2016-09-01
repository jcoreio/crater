import {compose} from 'redux'
import {combineReducers} from 'redux-immutablejs'
import {routerReducer} from 'react-router-redux'

const currentReducers = {
  router: routerReducer,
}

export default (newReducers, reducerEnhancers) => {
  Object.assign(currentReducers, newReducers)
  const reducer = combineReducers({...currentReducers})
  if (reducerEnhancers) {
    return Array.isArray(reducerEnhancers) ? compose(...reducerEnhancers)(reducer) : reducerEnhancers(reducer)
  }
  return reducer
}
