// @flow

import ErrorTest from '../components/ErrorTest'
import type {Store} from '../flowtypes/redux'

// eslint-disable-next-line no-unused-vars
export default (store: Store): Object => ({
  path: '/errorTest',
  component: ErrorTest,
})
