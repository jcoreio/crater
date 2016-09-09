import phantomjs from 'phantomjs-prebuilt'
import join from '../util/join'
import killOnExit from '../util/killOnExit'
import spawn from '../util/spawn'

phantomjs.run('--webdriver=4444').then(async program => {
  killOnExit(program)
  console.log('Started PhantomJS.')

  const wdio = spawn('node_modules/.bin/wdio', [...process.argv.slice(2), 'wdio.conf.js'], {
    stdio: 'inherit'
  })
  join(wdio).then(({code, signal}) => {
    if (code > 0 || signal != null) process.exit(1)
    else process.exit(0)
  }).catch(error => {
    console.error(error.stack)
    process.exit(1)
  })
}).catch(error => {
  console.error(error.stack)
  process.exit(1)
})
