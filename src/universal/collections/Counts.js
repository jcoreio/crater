/* @flow */

import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'

const Counts = new Mongo.Collection('counts')

export default Counts

if (Meteor.isServer) {
  Meteor.publish({
    counts(_id: string): Mongo.Cursor {
      let value = 0
      Counts.update({_id}, {$set: {value}})
      this.ready()
      const interval = Meteor.setInterval(() => {
        value++
        Counts.update({_id}, {$inc: {value: 1}})
      }, 1000)
      this.onStop((): any => Meteor.clearInterval(interval))
      return Counts.find({_id})
    }
  })
}
