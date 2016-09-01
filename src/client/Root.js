import React, {Component, PropTypes} from 'react'
import {Router, browserHistory} from 'react-router'
import {Provider} from 'react-redux'
import routes from '../routes/index'
import {syncHistoryWithStore} from 'react-router-redux'

export default class Root extends Component {
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  render() {
    const {store} = this.props
    const history = syncHistoryWithStore(browserHistory, store, {
      selectLocationState: state => state.get('router')
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
