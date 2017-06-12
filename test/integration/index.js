import * as webdriverio from 'webdriverio'
import {expect} from 'chai'
import exec from 'crater-util/lib/exec'
import {childPrinted} from 'async-child-process'
import kill from 'crater-util/lib/kill'
import spawnAsync from 'crater-util/lib/spawnAsync'
import execAsync from 'crater-util/lib/execAsync'
import dockerComposePort from 'crater-util/lib/dockerComposePort'
import dockerComposeEnv from '../../scripts/dockerComposeEnv'
import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import promisify from 'es6-promisify'
import {Collector} from 'istanbul'
import debug from 'debug'

/* global browser: false */

const popsicle = require('popsicle')

const browserLogsDebug = debug('wdio:logs:browser')
const printLogs = (process.env.DEBUG || '').split(/\s*,\s*|\s+/).indexOf('wdio:logs:browser') >= 0

const root = path.resolve(__dirname, '..', '..')
const errorShots = path.resolve(root, 'errorShots')
const src = path.join(root, 'src')
const build = path.join(root, 'build')
const webpack = path.join(root, 'webpack')

let phantomjs

function killProcessOnPort(port: number): Promise<void> {
  return execAsync('sudo fuser -KILL -k -n tcp ' + port).catch(() => {})
}

before(async function () {
  this.timeout(30000)
  if (process.env.CI) await killProcessOnPort(4444)

  console.log('phantomjs-prebuilt:') // eslint-disable-line no-console
  console.log(require('phantomjs-prebuilt')) // eslint-disable-line no-console
  const phantomJSPath = require('phantomjs-prebuilt').path
  console.log('Launching PhantomJS:', phantomJSPath, ' --webdriver=4444') // eslint-disable-line no-console
  phantomjs = exec(phantomJSPath + ' --webdriver=4444')
  await childPrinted(phantomjs, /running on port 4444/i)

  console.log('Launching webdriverio...') // eslint-disable-line no-console
  global.browser = webdriverio.remote({
    desiredCapabilities: {
      browserName: 'phantomjs',
    },
    logLevel: process.env.WDIO_LOG_LEVEL || 'command',
  })
  await browser.init()
})
after(async function () {
  this.timeout(30000)
  if (global.browser) await global.browser.end()
  if (phantomjs) await kill(phantomjs, 'SIGINT')
})

afterEach(async function () {
  const {state, title} = this.currentTest
  if (state === 'failed') {
    await mkdirp(errorShots)
    const file = path.join(errorShots, `ERROR_phantomjs_${title}_${new Date().toISOString()}.png`)
    browser.saveScreenshot(file)
    console.log('Saved screenshot to', file) // eslint-disable-line no-console

    if (!printLogs) {
      // log anyway for failed tests
      const logs = (await browser.log('browser')).value
      logs.forEach(({timestamp, level, message}) =>
        console.error('[browser log]', new Date(timestamp).toLocaleString(), level, message) // eslint-disable-line no-console
      )
    }
  }
  if (printLogs) {
    const logs = (await browser.log('browser')).value
    logs.forEach(({timestamp, level, message}) =>
      browserLogsDebug(`${new Date(timestamp).toLocaleString()} ${level} ${message}`)
    )
  }
})

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sharedTests(getRootUrl) {
  describe('shared tests', function () {
    this.timeout(10000)

    it('serves page with correct title', async function () {
      expect(await browser.getTitle()).to.equal('Crater')
    })
    it('serves page with correct header', async function () {
      expect(await browser.getText('h1')).to.equal('Welcome to Crater!')
    })
    it('serves up client css', async function () {
      const color = await browser.getCssProperty('h1', 'color')
      expect(color.parsed.hex).to.equal('#333333')
    })
    it('updates the counter', async function () {
      const getCounter = async () => {
        const text = await browser.getText('.counter')
        const match = /(\d+)/.exec(text)
        return match && parseInt(match[1])
      }

      const initCounter = await getCounter()
      await delay(2000)
      expect(await getCounter()).to.be.above(initCounter)
    })
    it('sends Meteor.settings.public to the client', async function () {
      expect(await browser.getText('.settings-test')).to.equal('success')
    })
    it('serves 404 for favicon', async () => {
      expect((await popsicle.get(await getRootUrl() + '/favicon.png')).status).to.equal(404)
    })
    it('allows switching between home and about page', async () => {
      await browser.click('=About')
      expect(await browser.getText('h1')).to.equal('About')
      await browser.click('=Home')
      expect(await browser.getText('h1')).to.equal('Welcome to Crater!')
    })
    it('proxies or defers to /sockjs', async () => {
      const response = (await popsicle.get(await getRootUrl() + '/sockjs/info')
        .use(popsicle.plugins.parse(['json', 'urlencoded']))).body
      expect(response.websocket).to.be.true
    })
  })
}

function unlinkIfExists(path, callback) {
  return fs.unlink(path, (err, result) => {
    if (err && /ENOENT/.test(err.message)) err = null
    return callback(err, result)
  })
}

// istanbul ignore next
async function mergeClientCoverage() {
  if (process.env.BABEL_ENV === 'coverage') {
    const collector = new Collector()

    collector.add(global.__coverage__)
    /* eslint-disable no-undef */
    collector.add((await browser.execute(() => window.__coverage__)).value)
    /* eslint-enable no-undef */
    global.__coverage__ = collector.getFinalCoverage()
  }
}

async function navigateTo(url) {
  if (process.env.DUMP_HTTP) {
    const res = await popsicle.get(url)
    /* eslint-disable no-console */
    console.log(`GET ${url} ${res.status}`)
    console.log(res.headers)
    console.log(res.body)
    /* eslint-enable no-console */
  }
  await browser.url(url)
}

async function logBrowserMessages() {
  const logs = (await browser.log('browser')).value
  if (!logs) return
  logs.forEach(({level, message, timestamp}) => {
    const time = new Date(timestamp).toLocaleTimeString()
    browserLogsDebug(`${time} ${level} ${message}`)
  })
}

describe('prod mode', function () {
  const env = {...process.env}
  const envDefaults =  require('../../env/prod')
  for (let key in envDefaults) delete env[key]
  const {ROOT_URL} = envDefaults

  let server
  const appFile = path.join(src, 'universal', 'components', 'App.js')
  const serverFile = path.join(src, 'server', 'index.js')
  let appCode, serverCode

  before(async function () {
    this.timeout(600000)
    if (process.env.CI)  await killProcessOnPort(envDefaults.PORT)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    serverCode = await promisify(fs.readFile)(serverFile, 'utf8')
    server = exec('npm run prod', {cwd: root, env})
    await childPrinted(server, /App is listening on http/i)
    await browser.reload()
    await navigateTo(ROOT_URL)
  })

  after(async function () {
    this.timeout(600000)
    if (server) await kill(server, 'SIGINT')
    // restore code in App.js, which (may) have been changed by hot reloading test
    if (appCode) await promisify(fs.writeFile)(appFile, appCode, 'utf8')
    if (serverCode) await promisify(fs.writeFile)(serverFile, serverCode, 'utf8')
    if (process.env.BABEL_ENV === 'coverage') await mergeClientCoverage()
    await logBrowserMessages()
  })

  sharedTests(() => ROOT_URL)

  describe('full server-side rendering', () => {
    it('renders contents of home page', async () => {
      const html = (await popsicle.get(ROOT_URL)).body
      expect(html).to.match(/Welcome to Crater!/)
    })
    it('renders contents of about page', async () => {
      const html = (await popsicle.get(ROOT_URL + '/about')).body
      expect(html).to.match(/About<\/h1>/)
    })
    it('responds with 404 for invalid routes', async () => {
      expect((await popsicle.get(ROOT_URL + '/wat')).status).to.equal(404)
    })
    it('displays error message if error occurs during streaming', async () => {
      const html = (await popsicle.get(ROOT_URL + '/errorTest')).body
      expect(html).to.match(/An internal server error occurred/)
    })
    it("doesn't crash when an error is thrown during rendering", async () => {
      await popsicle.get(ROOT_URL + '/errorTest')
      expect((await popsicle.get(ROOT_URL)).status).to.equal(200)
    })
  })

  if (process.env.BABEL_ENV !== 'coverage') {
    describe('hot reloading', function () {
      it('server restarts when code is changed', async function () {
        this.timeout(60000)
        const serverModified = serverCode.replace(/express\(\)/, 'express()\napp.get("/test", (req, res) => res.send("hello world"))')
        await promisify(fs.writeFile)(serverFile, serverModified, 'utf8')
        await childPrinted(server, /App is listening on http/i)

        const newHeader = 'Welcome to Crater! with hot reloading'
        const appModified = appCode.replace(/Welcome to Crater!/, newHeader)
        await promisify(fs.writeFile)(appFile, appModified, 'utf8')
        await childPrinted(server, /App is listening on http/i)
        const html = (await popsicle.get(ROOT_URL)).body
        expect(html).to.match(/Welcome to Crater! with hot reloading/)
      })
    })
  }
})

describe('prod mode with DISABLE_FULL_SSR=1', function () {
  const env = {...process.env, DISABLE_FULL_SSR: '1'}
  const envDefaults =  require('../../env/prod')
  for (let key in envDefaults) delete env[key]
  const {ROOT_URL} = envDefaults

  let server

  before(async function () {
    this.timeout(240000)
    if (process.env.CI)  await killProcessOnPort(envDefaults.PORT)
    server = exec('npm run prod', {env})
    await childPrinted(server, /App is listening on http/i)
    await browser.reload()
    await navigateTo(ROOT_URL)
  })

  it('does not perform full server-side rendering', async () => {
    const html = (await popsicle.get(ROOT_URL + '/about')).body
    expect(html).not.to.match(/<h1>About<\/h1>/)
  })

  sharedTests(() => ROOT_URL)

  after(async function () {
    this.timeout(30000)
    if (server) await kill(server, 'SIGINT')
    if (process.env.BABEL_ENV === 'coverage') await mergeClientCoverage()
    await logBrowserMessages()
  })
})

// in CI, only test docker in the Node 4 job (since Docker container is from Node 4 anyway)
if (!process.env.CI || process.version.startsWith('v4')) {
  describe('docker build', function () {
    const env = {...process.env}
    const envDefaults = require('../../env/prod')
    for (let key in envDefaults) delete env[key]

    let server

    const getRootUrl = async () => `http://${await dockerComposePort('crater', 80, {cwd: root})}`

    before(async function () {
      this.timeout(15 * 60000)
      if (process.env.CI)  await killProcessOnPort(envDefaults.PORT)
      // run this first, even though it's not necessary, to increase coverage of scripts/build.js
      await spawnAsync('npm', ['run', 'build'], {cwd: root, env})
      await spawnAsync('npm', ['run', 'build:docker'], {cwd: root, env})
      server = exec('npm run docker', {
        cwd: root,
        env: {
          ...env,
          METEOR_SETTINGS: JSON.stringify({
            public: {
              test: 'success'
            }
          })
        }
      })
      await childPrinted(server, /App is listening on http/i)
      await browser.reload()
      await navigateTo(await getRootUrl())
    })

    after(async function () {
      this.timeout(20000)
      if (process.env.BABEL_ENV === 'coverage') await mergeClientCoverage()
      await spawnAsync('docker-compose', ['down'], {
        cwd: root,
        env: await dockerComposeEnv(),
      })
      await logBrowserMessages()
    })

    sharedTests(getRootUrl)
  })
}

describe('dev mode', function () {
  const env = {...process.env}
  const envDefaults =  require('../../env/dev')
  for (let key in envDefaults) delete env[key]
  const {ROOT_URL} = envDefaults

  let server

  const appFile = path.join(src, 'universal', 'components', 'App.js')
  const serverFile = path.join(src, 'server', 'index.js')
  let appCode, serverCode

  before(async function () {
    this.timeout(15 * 60000)
    if (process.env.CI)  await killProcessOnPort(envDefaults.WEBPACK_PORT)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    serverCode = await promisify(fs.readFile)(serverFile, 'utf8')
    server = exec('npm start', {cwd: root, env})
    await Promise.all([
      childPrinted(server, /webpack built [a-z0-9]+ in \d+ms/i),
      childPrinted(server, /App is listening on http/i),
    ])
    await navigateTo(ROOT_URL)
  })

  after(async function () {
    this.timeout(15 * 60000)
    if (server) await kill(server, 'SIGINT')
    // restore code in App.js, which (may) have been changed by hot reloading test
    if (appCode) await promisify(fs.writeFile)(appFile, appCode, 'utf8')
    if (serverCode) await promisify(fs.writeFile)(serverFile, serverCode, 'utf8')
    if (process.env.BABEL_ENV === 'coverage') await mergeClientCoverage()
    await logBrowserMessages()
  })

  sharedTests(() => ROOT_URL)

  if (process.env.BABEL_ENV !== 'coverage') {
    describe('hot reloading', function () {
      it('works on the client', async function () {
        this.timeout(40000)
        const newHeader = 'Welcome to Crater! with hot reloading'
        const modified = appCode.replace(/Welcome to Crater!/, newHeader)
        await promisify(fs.writeFile)(appFile, modified, 'utf8')
        await browser.waitUntil(
          () => browser.getText('h1').then(text => text === newHeader),
          30000,
          'expected header text to hot update within 30s'
        )
      })

      it('server restarts when code is changed', async function () {
        this.timeout(60000)
        const modified = serverCode.replace(/express\(\)/, 'express()\napp.get("/test", (req, res) => res.send("hello world"))')
        await promisify(fs.writeFile)(serverFile, modified, 'utf8')
        await childPrinted(server, /App is listening on http/i)
        expect((await popsicle.get(ROOT_URL + '/test')).body).to.equal('hello world')
      })
    })
  }
})

describe('build scripts', function () {
  describe('build:meteor', function () {
    it('only rebuilds when necessary', async function () {
      this.timeout(480000)

      await promisify(rimraf)(path.join(build, 'meteor'))
      expect(/building meteor packages/i.test((await execAsync('npm run build:meteor', {cwd: root})).stdout)).to.be.true
      expect(/build\/meteor is up to date/i.test((await execAsync('npm run build:meteor', {cwd: root})).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(path.resolve(root, 'meteor', '.meteor', 'packages'), NaN, NaN)
      expect(/building meteor packages/i.test((await execAsync('npm run build:meteor', {cwd: root})).stdout)).to.be.true
      expect(/build\/meteor is up to date/i.test((await execAsync('npm run build:meteor', {cwd: root})).stdout)).to.be.true
    })
  })
  describe('build:client', function () {
    it('only rebuilds when necessary', async function () {
      this.timeout(480000)

      await spawnAsync('npm', ['run', 'build:meteor'], {stdio: 'inherit', cwd: root})

      await promisify(unlinkIfExists)(path.join(build, 'assets.json'))
      expect(/building client bundle/.test((await execAsync('npm run build:client', {cwd: root})).stdout)).to.be.true
      expect(/client assets are up to date/.test((await execAsync('npm run build:client', {cwd: root})).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(path.resolve(webpack, 'webpack.config.prod.js'), NaN, NaN)
      expect(/building client bundle/.test((await execAsync('npm run build:client', {cwd: root})).stdout)).to.be.true
      expect(/client assets are up to date/.test((await execAsync('npm run build:client', {cwd: root})).stdout)).to.be.true
    })
  })
  describe('build:server', function () {
    it('only rebuilds when necessary', async function () {
      this.timeout(480000)

      await spawnAsync('npm', ['run', 'build:meteor'], {stdio: 'inherit', cwd: root})

      await promisify(unlinkIfExists)(path.join(build, 'prerender.js'))
      expect(/building server bundle/.test((await execAsync('npm run build:server', {cwd: root})).stdout)).to.be.true
      expect(/server assets are up to date/.test((await execAsync('npm run build:server', {cwd: root})).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(path.resolve(webpack, 'webpack.config.server.js'), NaN, NaN)
      expect(/building server bundle/.test((await execAsync('npm run build:server', {cwd: root})).stdout)).to.be.true
      expect(/server assets are up to date/.test((await execAsync('npm run build:server', {cwd: root})).stdout)).to.be.true
    })
  })
})
