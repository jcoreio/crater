import {expect} from 'chai'
import {spawn} from 'child_process'
import path from 'path'

async function testHomePage() {
  await browser.url('/')
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

describe('dev mode', function () {
  it('works', async function () {
    this.timeout(60000)
    return new Promise(async (resolve, reject) => {
      let server
      try {
        server = await launchAndWait('npm start', /webpack built [a-z0-9]+ in \d+ms/i)
        await testHomePage()
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        if (server) server.kill()
      }
    })
  })
})

describe('prod mode', function () {
  it('works', async function () {
    this.timeout(120000)
    return new Promise(async (resolve, reject) => {
      let server
      try {
        await exec('npm run build')
        await exec('npm install', {
          cwd: path.join(__dirname, '../../build/meteor/bundle/programs/server'),
        })
        server = await launchAndWait('npm run prod', /App is listening on http/i)
        await testHomePage()
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        if (server) server.kill()
      }
    })
  })
})

async function exec(command, options = {}) {
  const parts = command.split(/\s+/g)
  return new Promise((resolve, reject) => {
    const child = spawn(parts[0], parts.slice(1), {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit',
      ...options,
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code > 0) return reject(`'${command}' exited with code ${code}`)
      resolve()
    })
    process.on('exit', () => child.kill())
  })
}

async function launchAndWait(command, predicate, options = {}) {
  const parts = command.split(/\s+/g)
  return new Promise((resolve, reject) => {
    const child = spawn(parts[0], parts.slice(1), {
      cwd: path.join(__dirname, '../..'),
      ...options,
    })
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('error', reject)
    child.stdout.on('data', data => {
      const message = data.toString()
      if (predicate instanceof RegExp ? predicate.test(message) : predicate(message)) resolve(child)
    })
    child.on('close', code => {
      if (code > 0) return reject(`'${command}' exited with code ${code}`)
    })
    process.on('exit', () => child.kill())
  })
}
