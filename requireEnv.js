// @flow

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`missing process.env.${name}`)
  return value
}

module.exports = requireEnv

