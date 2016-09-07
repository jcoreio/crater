import {expect} from 'chai'
import {spawn} from 'child_process'
import exec from '../../util/exec'
import kill from '../../util/kill'
import stdouted from '../../util/stdouted'
import spawnAsync from '../../util/spawnAsync'
import path from 'path'
import fs from 'fs'
import promisify from 'es6-promisify'

async function delay(ms) {
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

describe('prod mode', function () {
  let server

  before(async function () {
    this.timeout(240000)
    await spawnAsync('npm', ['run', 'build'])
    await spawnAsync('npm', ['install'], {
      cwd: path.join(__dirname, '../../build/meteor/bundle/programs/server'),
    })
    server = exec('npm run prod')
    await stdouted(server, /App is listening on http/i)
    await browser.reload()
    await browser.url(process.env.ROOT_URL)
  })

  after(async function () {
    this.timeout(30000)
    if (server) await kill(server)
  })

  sharedTests()
})

describe('docker build', function () {
  let server

  before(async function () {
    this.timeout(480000)
    let host
    await spawnAsync('which', ['docker-machine'], {silent: true})
      .then(() => host = '192.168.99.100')
      .catch(() => host = 'localhost')
    await spawnAsync('npm', ['run', 'build'])
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
    await browser.reload()
    await browser.url(`http://${host}:${process.env.PORT}/`)
  })

  after(async function () {
    this.timeout(20000)
    await spawnAsync('docker-compose', ['down'])
  })

  sharedTests()
})

describe('dev mode', function () {
  let server

  const appFile = path.resolve(__dirname, '../../src/universal/components/App.js')
  let appCode

  before(async function () {
    this.timeout(60000)
    appCode = await promisify(fs.readFile)(appFile, 'utf8')
    server = exec('npm start')
    await stdouted(server, /webpack built [a-z0-9]+ in \d+ms/i)
    await browser.url(`http://localhost:${process.env.DEV_SERVER_PORT}`)
  })

  after(async function () {
    this.timeout(30000)
    // restore code in App.js, which (may) have been changed by hot reloading test
    if (appCode) await promisify(fs.writeFile)(appFile, appCode, 'utf8')
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
})