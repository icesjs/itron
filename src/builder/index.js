const { reactScripts, vueCLIService, viteService } = require('../lib/resolve')

module.exports = (command, env) => {
  if (reactScripts.context) {
    return require('./craco')(command, env)
  }
  if (vueCLIService.context || viteService.context) {
    return require('./vue')(command, env)
  }
  throw new Error(`Not found supported builder`)
}
