// setup需要最先执行
require('../lib/setup')('test')
//
const { createLogger } = require('../lib/logger')
const { printErrorAndExit } = require('../lib/utils')
const { runScript } = require('../lib/runner')
const builder = require('../builder')

// 运行构建
async function run() {
  const { env, script, args } = builder('test')
  return runScript({
    logger: createLogger({ colorFormat: null }),
    exitHandle: (code) => code !== 0 && process.exit(code),
    script,
    env,
    args
  }).start()
}

module.exports = (options) => run(options).catch(printErrorAndExit)
