import {Meteor} from 'meteor/meteor'
import {Mongo} from 'meteor/mongo'

let Counts
if (__CLIENT__) {
  Counts = new Mongo.Collection('counts')
} else {
  Meteor.publish('counts', function counts(countName) {
    let value = 0
    this.added('counts', countName, {value})
    this.ready()
    const interval = Meteor.setInterval(() => {
      value++
      this.changed('counts', countName, {value})
    }, 1000)
    this.onStop(() => Meteor.clearInterval(interval))
  })
}

export default Counts