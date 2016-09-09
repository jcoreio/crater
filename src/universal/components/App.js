import React, {Component} from 'react'
import {Meteor} from 'meteor/meteor'
import Counts from '../collections/Counts'

import styles from './App.css'

export default class App extends Component {
  state = {value: 0};

  componentWillMount() {
    if (Meteor.isClient) {
      this.sub = Meteor.subscribe('counts', 'a')
      this.observer = Counts.find({_id: 'a'}).observeChanges({
        added: (id, fields) => this.setState(fields),
        changed: (id, fields) => this.setState(fields),
      })
    }
  }
  componentWillUnmount() {
    if (Meteor.isClient) {
      this.observer.stop()
      this.sub.stop()
    }
  }
  render() {
    return (
      <div className={styles.app}>
        <h1>Welcome to Crater!</h1>
        <h3 className="counter">Counter: {this.state.value}</h3>
        <h3>Meteor.settings.public.test: <span className="settings-test">{Meteor.settings.public.test}</span></h3>
      </div>
    )
  }
}
