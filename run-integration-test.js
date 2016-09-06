import phantomjs from 'phantomjs-prebuilt'
import exec from './util/exec'
import launchAndWait from './util/launchAndWait'
import {spawn} from 'child_process'
import terminate from 'terminate'
import fs from 'fs'
import path from 'path'
import glob from 'glob'
import promisify from 'es6-promisify'

phantomjs.run('--webdriver=4444').then(async program => {
  let needToRunMeteor = true
  try {
    needToRunMeteor = !fs.statSync(path.join(__dirname, 'meteor/.meteor/local/build/programs/server')).isDirectory()
  } catch (err) {
    // ignore
  }
  if (needToRunMeteor) {
    const meteor = await launchAndWait('meteor', /App running at: http/i, {
      cwd: path.join(__dirname, 'meteor')
    })
    meteor.kill('SIGINT')

    const release = await promisify(fs.readFile)(path.join(__dirname, 'meteor', '.meteor', 'release'), 'utf8')
    const match = /METEOR@(\d+\.\d+\.\d+)(\.(\d+))?/.exec(release)
    const meteorVersion = match && `${match[1]}${match[3] ? '_' + match[3] : ''}`

    // rebuild native packages used by meteor
    const paths = await promisify(glob)(path.join(
      process.env.HOME, '.meteor', 'packages', 'meteor-tool', meteorVersion, 'mt-*', 'dev_bundle', 'server-lib'
    ))
    if (paths.length) await exec('npm rebuild', {cwd: paths[0]})
  }

  let phantomjsExited = false
  program.on('close', () => phantomjsExited = true)
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
  wdio.on('close', code => wdioExited = true)
  wdio.on('exit', code => {
    wdioExited = true
    if (code != null) process.exit(code)
    process.exit(1)
  })
  const kill = () => {
    if (!phantomjsExited) {
      program.kill()
      terminate(program.pid)
    }
    if (!wdioExited) {
      wdio.kill()
      terminate(wdio.pid)
    }
  }
  process.on('exit', kill)
  process.on('SIGINT', kill)
  process.on('SIGTERM', kill)
}).catch(error => {
  console.error(error.stack)
  process.exit(1)
})
