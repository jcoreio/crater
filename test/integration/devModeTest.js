import {expect} from 'chai'
import {spawn} from 'child_process'
import path from 'path'

function messageReceived(childProc, predicate) {
  return new Promise(resolve => {
    childProc.stdout.on('data', data => {
      const message = data.toString()
      if (predicate(message)) resolve(message)
    })
  })
}

describe('npm start', function () {
  it('works', async function () {
    this.timeout(100000)
    return new Promise(async (resolve, reject) => {
      let server
      try {
        server = spawn('npm', ['start'], {
          cwd: path.join(__dirname, '../..'),
          stdio: ['pipe', 'pipe', 'pipe'],
        })
        server.stdout.pipe(process.stdout)
        server.stderr.pipe(process.stderr)

        server.on('error', reject)
        await messageReceived(server, msg => /webpack built [a-z0-9]+ in \d+ms/i.test(msg))

        expect(await browser.url('http://localhost:9000').getTitle()).to.equal('Crater')
        resolve()
      } catch (error) {
        reject(error)
      } finally {
        if (server) server.kill()
      }
    })
  })
})