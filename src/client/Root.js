/* @flow */

import React, {Component, PropTypes} from 'react'
import {Router, browserHistory} from 'react-router'
import {Provider} from 'react-redux'
import routes from '../universal/routes/index'
import {syncHistoryWithStore} from 'react-router-redux'
import type {Store, State} from '../universal/flowtypes/redux'

type Props = {
  store: Store,
}

export default class Root extends Component<void,Props,void> {
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  render(): React.Element<any> {
    const {store} = this.props
    const history = syncHistoryWithStore(browserHistory, store, {
      selectLocationState: (state: State): Object => state.get('router')
    })
    return (
      <Provider store={store}>
        <div>
          <Router history={history} routes={routes(store)} />
        </div>
      </Provider>
    )
  }
}
