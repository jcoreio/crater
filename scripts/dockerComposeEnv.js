// @flow

import execAsync from 'crater-util/lib/execAsync'
import dockerEnv from 'crater-util/lib/dockerEnv'
import getDockerIP from 'crater-util/lib/getDockerIP'

export default async function dockerComposeEnv(): Promise<Object> {
  const {TARGET} = process.env
  return {
    ...process.env,
    ...await dockerEnv(),
    NAME: `crater${TARGET ? '-' + TARGET : ''}`,
    ROOT_URL: `http://${await getDockerIP()}:3000`,
    TAG: (await execAsync('git rev-parse HEAD', {silent: true})).stdout.trim(),
  }
}

