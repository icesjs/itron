const path = require('path')

function getBuilderScript(command) {
  return require.resolve(`@craco/craco/scripts/${command}`)
}

function getConfigFilePath() {
  return path.join(__dirname, '../config/craco/index.js')
}

module.exports = (command, env) => ({
  script: getBuilderScript(command),
  args: ['--config', getConfigFilePath()],
  env
})
