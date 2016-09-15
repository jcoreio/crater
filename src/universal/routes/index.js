// @flow

import type {Store} from '../flowtypes/redux'

export default (store: Store): Object => {
  return {
    childRoutes: [
      require('./home').default(store),
    ],
  }
}
