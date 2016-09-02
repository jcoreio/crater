import phantomjs from 'phantomjs-prebuilt'
import {spawn} from 'child_process'

phantomjs.run('--webdriver=4444').then(program => {
  let phantomjsExited = false
  program.on('exit', () => phantomjsExited = true)
  console.log('Started PhantomJS.')

  const wdio = spawn('node_modules/.bin/wdio', ['wdio.conf.js'], {
    stdio: 'inherit'
  })
  wdio.on('error', error => {
    console.error(error.stack)
    process.exit(1)
  })
  let wdioExited = false
  wdio.on('exit', code => {
    wdioExited = true
    if (code != null) process.exit(code)
    process.exit(1)
  })
  const kill = () => {
    if (!phantomjsExited) program.kill('SIGKILL')
    if (!wdioExited) wdio.kill('SIGKILL')
  }
  process.on('exit', kill)
  process.on('SIGINT', kill)
  process.on('SIGTERM', kill)
})
