import {expect} from 'chai'
import exec from '../../scripts/util/exec'
import kill from '../../scripts/util/kill'
import stdouted from '../../scripts/util/stdouted'
import spawnAsync from '../../scripts/util/spawnAsync'
import execAsync from '../../scripts/util/execAsync'
import path from 'path'
import fs from 'fs'
import rimraf from 'rimraf'
import promisify from 'es6-promisify'
import webpackConfig from '../../webpack/webpack.config.dev'

const root = path.resolve(__dirname, '..', '..')
const src = path.join(root, 'src')
const build = path.join(root, 'build')
const webpack = path.join(root, 'webpack')

/* global browser: false */

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function sharedTests() {
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
}

function unlinkIfExists(path, callback) {
  return fs.unlink(path, (err, result) => {
    if (err && /ENOENT/.test(err.message)) err = null
    return callback(err, result)
  })
}

describe('build scripts', function () {
  describe('build:meteor', function () {
    it('only rebuilds when necessary', async function () {
      this.timeout(480000)

      await promisify(rimraf)(path.join(build, 'meteor'))
      expect(/building meteor packages/i.test((await execAsync('npm run build:meteor')).stdout)).to.be.true

      expect(/build\/meteor is up to date/i.test((await execAsync('npm run build:meteor')).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(
        path.resolve(root, 'meteor', '.meteor', 'packages'),
        NaN,
        NaN,
      )
      expect(/building meteor packages/i.test((await execAsync('npm run build:meteor')).stdout)).to.be.true

      expect(/build\/meteor is up to date/i.test((await execAsync('npm run build:meteor')).stdout)).to.be.true
    })
  })
  describe('build:client', function () {
    it('only rebuilds when necessary', async function () {
      this.timeout(480000)

      await spawnAsync('npm', ['run', 'build:meteor'], {stdio: 'inherit'})

      await promisify(unlinkIfExists)(path.join(build, 'assets.json'))
      expect(/building client bundle/.test((await execAsync('npm run build:client')).stdout)).to.be.true

      expect(/client assets are up to date/.test((await execAsync('npm run build:client')).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(
        path.resolve(webpack, 'webpack.config.prod.js'),
        NaN,
        NaN
      )
      expect(/building client bundle/.test((await execAsync('npm run build:client')).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(
        path.resolve(src, 'client', 'index.js'),
        NaN,
        NaN
      )
      expect(/building client bundle/.test((await execAsync('npm run build:client')).stdout)).to.be.true

      expect(/client assets are up to date/.test((await execAsync('npm run build:client')).stdout)).to.be.true
    })
  })
  describe('build:server', function () {
    it('only rebuilds when necessary', async function () {
      this.timeout(480000)

      await spawnAsync('npm', ['run', 'build:meteor'], {stdio: 'inherit'})

      await promisify(unlinkIfExists)(path.join(build, 'prerender.js'))
      expect(/building server bundle/.test((await execAsync('npm run build:server')).stdout)).to.be.true

      expect(/server assets are up to date/.test((await execAsync('npm run build:server')).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(
        path.resolve(webpack, 'webpack.config.server.js'),
        NaN,
        NaN
      )
      expect(/building server bundle/.test((await execAsync('npm run build:server')).stdout)).to.be.true

      await delay(1000)
      await promisify(fs.utimes)(
        path.resolve(src, 'server', 'index.js'),
        NaN,
        NaN
      )
      expect(/building server bundle/.test((await execAsync('npm run build:server')).stdout)).to.be.true

      expect(/server assets are up to date/.test((await execAsync('npm run build:server')).stdout)).to.be.true
    })
  })
})

describe('prod mode', function () {
  let server
  const appFile = path.join(src, 'universal', 'components', 'App.js')
  const serverFile = path.join(src, 'server', 'index.js')
  let appCode, serverCode

  before(async function () {
    this.timeout(240000)
    await promisify(rimraf)(build)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    serverCode = await promisify(fs.readFile)(serverFile, 'utf8')
    server = exec('npm run prod')
    await stdouted(server, /App is listening on http/i)
    await browser.reload()
    await browser.url(process.env.ROOT_URL)
  })

  after(async function () {
    this.timeout(30000)
    // restore code in App.js, which (may) have been changed by hot reloading test
    if (appCode) await promisify(fs.writeFile)(appFile, appCode, 'utf8')
    if (serverCode) await promisify(fs.writeFile)(serverFile, serverCode, 'utf8')
    if (server) await kill(server)
  })

  sharedTests()

  it('restarts the server when code is changed', async function () {
    this.timeout(60000)
    const serverModified = serverCode.replace(/express\(\)/, 'express()\napp.get("/test", (req, res) => res.send("hello world"))')
    await promisify(fs.writeFile)(serverFile, serverModified, 'utf8')
    await stdouted(server, /App is listening on http/i)

    const newHeader = 'Welcome to Crater! with hot reloading'
    const appModified = appCode.replace(/Welcome to Crater!/, newHeader)
    await promisify(fs.writeFile)(appFile, appModified, 'utf8')
    await stdouted(server, /App is listening on http/i)
  })
})

describe('docker build', function () {
  let server

  before(async function () {
    this.timeout(15 * 60000)
    await promisify(rimraf)(build)
    await spawnAsync('npm', ['run', 'build:docker'])
    server = exec('npm run docker', {
      env: {
        ...process.env,
        METEOR_SETTINGS: JSON.stringify({
          public: {
            test: 'success'
          }
        })
      }
    })
    await stdouted(server, /App is listening on http/i)
    let host
    if (process.env.CI) host = (await execAsync('docker-compose port crater 80')).stdout.trim()
    else {
      await execAsync('which docker-machine')
        .then(() => host = `192.168.99.100:${process.env.PORT}`)
        .catch(() => host = `localhost:${process.env.PORT}`)
    }
    await browser.reload()
    await browser.url(`http://${host}`)
  })

  after(async function () {
    this.timeout(20000)
    await spawnAsync('docker-compose', ['down'])
  })

  sharedTests()
})

describe('dev mode', function () {
  let server

  const appFile = path.join(src, 'universal', 'components', 'App.js')
  const serverFile = path.join(src, 'server', 'index.js')
  let appCode, serverCode

  before(async function () {
    this.timeout(60000)
    await promisify(rimraf)(build)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    serverCode = await promisify(fs.readFile)(serverFile, 'utf8')
    server = exec('npm start')
    await stdouted(server, /webpack built [a-z0-9]+ in \d+ms/i)
    await browser.url(`http://localhost:${webpackConfig.devServer.port}`)
  })

  after(async function () {
    this.timeout(30000)
    // restore code in App.js, which (may) have been changed by hot reloading test
    if (appCode) await promisify(fs.writeFile)(appFile, appCode, 'utf8')
    if (serverCode) await promisify(fs.writeFile)(serverFile, serverCode, 'utf8')
    if (server) await kill(server)
  })

  sharedTests()

  it('supports hot reloading', async function () {
    this.timeout(40000)
    const newHeader = 'Welcome to Crater! with hot reloading'
    const modified = appCode.replace(/Welcome to Crater!/, newHeader)
    await promisify(fs.writeFile)(appFile, modified, 'utf8')
    await browser.waitUntil(
      () => browser.getText('h1') === newHeader,
      20000,
      'expected header text to hot update within 10s'
    )
  })

  it('restarts the server when code is changed', async function () {
    this.timeout(60000)
    const modified = serverCode.replace(/express\(\)/, 'express()\napp.get("/test", (req, res) => res.send("hello world"))')
    await promisify(fs.writeFile)(serverFile, modified, 'utf8')
    await stdouted(server, /App is listening on http/i)
  })
})