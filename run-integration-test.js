import phantomjs from 'phantomjs-prebuilt'
import {spawn} from 'child_process'

phantomjs.run('--webdriver=4444').then(program => {
  console.log('Started PhantomJS.')
  const wdio = spawn('node_modules/.bin/wdio', ['wdio.conf.js'], {
    stdio: 'inherit'
  })
  wdio.on('error', error => {
    console.error(error.stack)
    process.exit(1)
  })
  const kill = () => {
    program.kill()
    wdio.kill()
  }
  process.on('exit', kill)
  process.on('SIGINT', kill)
  process.on('SIGTERM', kill)

  wdio.on('close', code => process.exit(code))
})
