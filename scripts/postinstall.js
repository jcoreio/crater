import asyncScript from '../util/asyncScript'
import spawn from '../util/spawn'
import stdouted from '../util/stdouted'
import kill from '../util/kill'
import path from 'path'
import reinstallMeteorDeps from './reinstall-meteor-deps'

asyncScript(async () => {
  const meteor = spawn('meteor', {
    cwd: path.resolve(__dirname, '../meteor')
  })
  await stdouted(meteor, /App running at: http/i, 10 * 60000)
  await kill(meteor, 'SIGINT', 10 * 60000)

  // rebuild native packages used by meteor
  await reinstallMeteorDeps()
})