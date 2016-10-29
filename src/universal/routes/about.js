// @flow

import About from '../components/About'
import type {Store} from '../flowtypes/redux'

// eslint-disable-next-line no-unused-vars
export default (store: Store): Object => ({
  path: '/about',
  component: About,
})
