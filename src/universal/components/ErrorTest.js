// @flow

import React from 'react'

const ErrorTest = (): React.Element<any> => {
  throw new Error("Test!")
}

export default ErrorTest

