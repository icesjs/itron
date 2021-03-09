const { vueCLIService, viteService } = require('../lib/resolve')

function getServiceBin() {
  if (vueCLIService.context) {
    return vueCLIService.bin
  }
  return viteService.bin
}

function getCommandArgs(command, env) {
  const { HTTPS, HOST, PORT, BROWSER } = env
  const args = []
  if (command === 'start') {
    args.push('serve')
    args.push('--mode', 'development')
  } else {
    args.push('build')
    args.push('--mode', 'production')
  }
  if (HTTPS) {
    args.push('--https')
  }
  if (HOST) {
    args.push('--host', HOST)
  }
  if (PORT) {
    args.push('--port', PORT)
  }
  if (BROWSER && BROWSER !== 'none') {
    args.push('--open')
  } else {
    args.push('--no-open')
  }
  return args
}

module.exports = (command, env) => ({
  script: getServiceBin(),
  args: getCommandArgs(command, env),
  env
})
