async function asyncScript(run) {
  try {
    await run()
    process.exit(0)
  } catch (error) {
    console.error(error.stack)
    process.exit(1)
  }
}

export default asyncScript
