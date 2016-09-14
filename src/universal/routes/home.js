// @flow

import App from '../components/App'
import type {Store} from '../flowtypes/redux'

// eslint-disable-next-line no-unused-vars
export default (store: Store): Object => ({
  path: '/',
  indexRoute: {
    component: App,
  },
})
