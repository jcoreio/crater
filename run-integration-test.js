import phantomjs from 'phantomjs-prebuilt'
import launchAndWait from './util/launchAndWait'
import {spawn} from 'child_process'
import terminate from 'terminate'
import promisify from 'es6-promisify'
import fs from 'fs'
import path from 'path'

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
    await promisify(terminate)(meteor.pid)
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
    if (!phantomjsExited) terminate(program.pid)
    if (!wdioExited) terminate(wdio.pid)
  }
  process.on('exit', kill)
  process.on('SIGINT', kill)
  process.on('SIGTERM', kill)
}).catch(error => {
  console.error(error.stack)
  process.exit(1)
})
