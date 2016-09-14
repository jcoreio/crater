async function asyncScript(run, options = {}) {
  try {
    await run()
    if (options.exitOnSuccess !== false) process.exit(0)
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

export default asyncScript
