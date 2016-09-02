import {expect} from 'chai'
import {spawn} from 'child_process'
import exec from '../../util/exec'
import launchAndWait from '../../util/launchAndWait'
import path from 'path'

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function testHomePage() {
  this.timeout(60000)
  expect(await browser.getTitle()).to.equal('Crater')
  expect(await browser.getText('h1')).to.equal('Welcome to Crater!')

  const getCounter = async () => {
    const text = await browser.getText('h3')
    console.log(text)
    const match = /(\d+)/.exec(text)
    return match && parseInt(match[1])
  }

  const initCounter = await getCounter()
  await new Promise(resolve => setTimeout(resolve, 2000))
  expect(await getCounter()).to.be.above(initCounter)
}

function sharedTests() {
  it('serves page with correct title', async function () {
    expect(await browser.getTitle()).to.equal('Crater')
  })
  it('serves page with correct header', async function () {
    expect(await browser.getText('h1')).to.equal('Welcome to Crater!')
  })
  it('updates the counter', async function() {
    const getCounter = async () => {
      const text = await browser.getText('h3')
      console.log(text)
      const match = /(\d+)/.exec(text)
      return match && parseInt(match[1])
    }

    const initCounter = await getCounter()
    await delay(2000)
    expect(await getCounter()).to.be.above(initCounter)
  })
}

describe('dev mode', function () {
  let server

  before(async function () {
    this.timeout(30000)
    server = await launchAndWait('npm start', /webpack built [a-z0-9]+ in \d+ms/i)
    await browser.url('/')
  })

  after(async function () {
    if (server) server.kill()
  })

  sharedTests()
})

describe('prod mode', function () {
  let server

  before(async function () {
    this.timeout(120000)
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

