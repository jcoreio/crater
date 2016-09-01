export default store => {
  return {
    childRoutes: [
      require('./home').default(store),
    ]
  }
}
