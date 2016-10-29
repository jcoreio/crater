// @flow

import React from 'react'
import {Link} from 'react-router'

const About = (): React.Element<any> => (
  <div>
    <h1>About</h1>
    <p>
      This is an app skeleton that uses Meteor, Webpack, and React.
    </p>
    <p>
      Unlike a traditional Meteor app, it allows you to avoid building any of your app code with
      Meteor's isobuild, which in my experience has been slow and even hangs on large Webpack bundles.
      It also uses react-hot-loader and Webpack hot reloading, allowing you to iterate much faster
      than possible with Meteor's dev tools.
    </p>
    <Link to="/">Home</Link>
  </div>
)

export default About

