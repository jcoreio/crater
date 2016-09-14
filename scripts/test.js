// @flow

import phantomjs from 'phantomjs-prebuilt'
import join from '../util/join'
import killOnExit from '../util/killOnExit'
import spawn from '../util/spawn'
import spawnAsync from '../util/spawnAsync'

import type {ChildProcess} from 'child_process'
import type {Result} from '../util/join'

phantomjs.run('--webdriver=4444').then(async (program: ChildProcess): Promise<any> => {
  killOnExit(program)
  console.log('Started PhantomJS.')

  await spawnAsync('npm', ['run', 'flow'], {stdio: 'inherit'})
  await spawnAsync('npm', ['run', 'lint'], {stdio: 'inherit'})

  const wdio = spawn('node_modules/.bin/wdio', [...process.argv.slice(2), 'wdio.conf.js'], {
    stdio: 'inherit'
  })
  join(wdio).then(({code, signal}: Result) => {
    if ((code != null && code > 0) || signal != null) process.exit(1)
    else process.exit(0)
  }).catch((error: Error) => {
    console.error(error.stack)
    process.exit(1)
  })
}).catch((error: Error) => {
  console.error(error.stack)
  process.exit(1)
})
