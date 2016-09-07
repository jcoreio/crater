import phantomjs from 'phantomjs-prebuilt'
import exec from './util/exec'
import spawnAsync from './util/spawnAsync'
import stdouted from './util/stdouted'
import join from './util/join'
import killOnExit from './util/killOnExit'
import spawn from './util/spawn'
import kill from './util/kill'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import promisify from 'es6-promisify'

phantomjs.run('--webdriver=4444').then(async program => {
  killOnExit(program)
  console.log('Started PhantomJS.')

  let needToRunMeteor = true
  try {
    needToRunMeteor = !fs.statSync(path.join(__dirname, 'meteor/.meteor/local/build/programs/server')).isDirectory()
  } catch (err) {
    // ignore
  }
  if (needToRunMeteor) {
    const meteor = exec('meteor', {
      cwd: path.join(__dirname, 'meteor')
    })
    await stdouted(meteor, /App running at: http/i, 10 * 60000)
    await kill(meteor, 10 * 60000)

    const release = await promisify(fs.readFile)(path.join(__dirname, 'meteor', '.meteor', 'release'), 'utf8')
    const match = /METEOR@(\d+\.\d+\.\d+)(\.(\d+))?/.exec(release)
    const meteorVersion = match && `${match[1]}${match[3] ? '_' + match[3] : ''}`

    // rebuild native packages used by meteor
    const paths = await promisify(glob)(path.join(
      process.env.HOME, '.meteor', 'packages', 'meteor-tool', meteorVersion, 'mt-*', 'dev_bundle', 'server-lib'
    ))
    if (paths.length) await spawnAsync('npm', ['rebuild'], {timeout: 10 * 60000, cwd: paths[0]})
  }

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
