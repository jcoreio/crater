import {expect} from 'chai'
import {spawn, execSync} from 'child_process'
import exec from '../../util/exec'
import launchAndWait from '../../util/launchAndWait'
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

describe('dev mode', function () {
  let server

  before(async function () {
    this.timeout(60000)
    server = await launchAndWait('npm start', /webpack built [a-z0-9]+ in \d+ms/i)
    await browser.url('/')
  })

  after(async function () {
    if (server) server.kill()
  })

  sharedTests()

  it('supports hot reloading', async function () {
    this.timeout(40000)
    const appFile = path.resolve(__dirname, '../../src/universal/components/App.js')
    const appCode = await promisify(fs.readFile)(appFile, 'utf8')
    const newHeader = 'Welcome to Crater! with hot reloading'
    const modified = appCode.replace(/Welcome to Crater!/, newHeader)
    try {
      await promisify(fs.writeFile)(appFile, modified, 'utf8')
      await browser.waitUntil(
        () => browser.getText('h1') === newHeader,
        20000,
        'expected header text to hot update within 10s'
      )
    } finally {
      await promisify(fs.writeFile)(appFile, appCode, 'utf8')
    }
  })
})

describe('prod mode', function () {
  let server

  before(async function () {
    this.timeout(240000)
    await exec('npm run build')
    await exec('npm install', {
      cwd: path.join(__dirname, '../../build/meteor/bundle/programs/server'),
    })
    server = await launchAndWait('npm run prod', /App is listening on http/i)
    await browser.url('/')
  })

  after(async function () {
    if (server) server.kill()
  })

  sharedTests()
})

describe('docker build', function () {
  let server

  before(async function () {
    this.timeout(120000)
    const host = execSync('which docker-machine') ? '192.168.99.100' : 'localhost'
    await exec('npm run build')
    await exec('npm run build:docker')
    server = await launchAndWait('npm run docker', /App is listening on http/i, {
      env: {
        ...process.env,
        METEOR_SETTINGS: JSON.stringify({
          public: {
            test: 'success'
          }
        })
      }
    })
    await browser.url(`http://${host}:3000/`)
  })

  after(async function () {
    this.timeout(20000)
    execSync('docker-compose down', {stdio: 'inherit'})
  })

  sharedTests()
})