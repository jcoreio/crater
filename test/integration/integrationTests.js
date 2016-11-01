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
import promisify from 'es6-promisify'
import {Collector} from 'istanbul'
import webpackConfig from '../../webpack/webpack.config.dev'
import debug from 'debug'

const popsicle = require('popsicle')

const browserLogsDebug = debug('crater:logs:browser')

const root = path.resolve(__dirname, '..', '..')
const src = path.join(root, 'src')
const build = path.join(root, 'build')
const webpack = path.join(root, 'webpack')

/* global browser: false */

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sharedTests(getRootUrl = async () => Promise.resolve(process.env.ROOT_URL)) {
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
  let server
  const appFile = path.join(src, 'universal', 'components', 'App.js')
  const serverFile = path.join(src, 'server', 'index.js')
  let appCode, serverCode

  before(async function () {
    this.timeout(600000)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    serverCode = await promisify(fs.readFile)(serverFile, 'utf8')
    server = exec('npm run prod', {cwd: root})
    await childPrinted(server, /App is listening on http/i)
    await browser.reload()
    await navigateTo(process.env.ROOT_URL)
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

  sharedTests()

  describe('full server-side rendering', () => {
    it('renders contents of home page', async () => {
      const html = (await popsicle.get(process.env.ROOT_URL)).body
      expect(html).to.match(/Welcome to Crater!/)
    })
    it('renders contents of about page', async () => {
      const html = (await popsicle.get(process.env.ROOT_URL + '/about')).body
      expect(html).to.match(/About<\/h1>/)
    })
    it('responds with 404 for invalid routes', async () => {
      expect((await popsicle.get(process.env.ROOT_URL + '/wat')).status).to.equal(404)
    })
    it('displays error message if error occurs during streaming', async () => {
      const html = (await popsicle.get(process.env.ROOT_URL + '/errorTest')).body
      expect(html).to.match(/An internal server error occurred/)
    })
    it("doesn't crash when an error is thrown during rendering", async () => {
      await popsicle.get(process.env.ROOT_URL + '/errorTest')
      expect((await popsicle.get(process.env.ROOT_URL)).status).to.equal(200)
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
        const html = (await popsicle.get(process.env.ROOT_URL)).body
        expect(html).to.match(/Welcome to Crater! with hot reloading/)
      })
    })
  }
})

describe('prod mode with DISABLE_FULL_SSR=1', function () {
  let server

  before(async function () {
    this.timeout(240000)
    server = exec('npm run prod', {
      env: {
        ...process.env,
        DISABLE_FULL_SSR: '1',
      },
    })
    await childPrinted(server, /App is listening on http/i)
    await browser.reload()
    await navigateTo(process.env.ROOT_URL)
  })

  it('does not perform full server-side rendering', async () => {
    const html = (await popsicle.get(process.env.ROOT_URL + '/about')).body
    expect(html).not.to.match(/<h1>About<\/h1>/)
  })

  sharedTests()

  after(async function () {
    this.timeout(30000)
    if (server) await kill(server, 'SIGINT')
    if (process.env.BABEL_ENV === 'coverage') await mergeClientCoverage()
    await logBrowserMessages()
  })
})

describe('docker build', function () {
  let server

  const getRootUrl = async () => `http://${await dockerComposePort('crater', 80, {cwd: root})}`

  before(async function () {
    this.timeout(15 * 60000)
    // run this first, even though it's not necessary, to increase coverage of scripts/build.js
    await spawnAsync('npm', ['run', 'build'], {cwd: root})
    await spawnAsync('npm', ['run', 'build:docker'], {cwd: root})
    server = exec('npm run docker', {
      cwd: root,
      env: {
        ...process.env,
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

describe('dev mode', function () {
  let server

  const appFile = path.join(src, 'universal', 'components', 'App.js')
  const serverFile = path.join(src, 'server', 'index.js')
  let appCode, serverCode

  before(async function () {
    this.timeout(15 * 60000)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    serverCode = await promisify(fs.readFile)(serverFile, 'utf8')
    server = exec('npm start', {cwd: root})
    await Promise.all([
      childPrinted(server, /webpack built [a-z0-9]+ in \d+ms/i),
      childPrinted(server, /App is listening on http/i),
    ])
    await navigateTo(`http://localhost:${webpackConfig.devServer.port}`)
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

  sharedTests()

  if (process.env.BABEL_ENV !== 'coverage') {
    describe('hot reloading', function () {
      it('works on the client', async function () {
        this.timeout(40000)
        const newHeader = 'Welcome to Crater! with hot reloading'
        const modified = appCode.replace(/Welcome to Crater!/, newHeader)
        await promisify(fs.writeFile)(appFile, modified, 'utf8')
        await browser.waitUntil(
          () => browser.getText('h1') === newHeader,
          30000,
          'expected header text to hot update within 30s'
        )
      })

      it('server restarts when code is changed', async function () {
        this.timeout(60000)
        const modified = serverCode.replace(/express\(\)/, 'express()\napp.get("/test", (req, res) => res.send("hello world"))')
        await promisify(fs.writeFile)(serverFile, modified, 'utf8')
        await childPrinted(server, /App is listening on http/i)
        expect((await popsicle.get(process.env.ROOT_URL + '/test')).body).to.equal('hello world')
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
