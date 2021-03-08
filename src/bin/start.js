// setup需要最先执行
require('../lib/setup')('development')
//
const path = require('path')
const { format: urlFormat } = require('url')
const fetch = require('node-fetch')
const wait = require('wait-on')
const { log, createPrefixedLogger } = require('../lib/logger')
const { getAvailablePort, printErrorAndExit } = require('../lib/utils')
const { runWebpack, runScript } = require('../lib/runner')
const builder = require('../builder')

// 运行构建
run().catch(printErrorAndExit)

async function run() {
  const {
    HTTPS,
    HOST,
    PORT,
    AUTO_RELAUNCH_DELAY,
    AUTO_RELAUNCH_APP,
    AUTO_LAUNCH_APP,
    RENDERER_BUILD_TARGET,
    LOG_PREFIX_COLOR_MAIN,
    LOG_PREFIX_COLOR_RENDERER,
    LOG_PREFIX_COLOR_ELECTRON
  } = process.env
  const port = await getAvailablePort(PORT)
  const indexURL = urlFormat({
    protocol: `http${HTTPS ? 's' : ''}`,
    hostname: HOST || 'localhost',
    port
  })
  const isEnvElectron = RENDERER_BUILD_TARGET === 'electron-renderer'

  let main
  let electron

  //
  const beforeExit = (callback) => (main ? main.stop(callback) : callback())
  const { env, script, args } = builder('start', {
    PORT: `${port}`,
    ...(isEnvElectron ? { BROWSER: 'none' } : {})
  })

  // Renderer
  runScript({
    logger: createPrefixedLogger('renderer', LOG_PREFIX_COLOR_RENDERER),
    script,
    env,
    args,
    beforeExit
  }).start()

  // Main
  main = runWebpack({
    logger: createPrefixedLogger('main', LOG_PREFIX_COLOR_MAIN),
    config: path.join(__dirname, '../config/electron.webpack.js'),
    env: {
      APP_INDEX_HTML_URL: indexURL,
      WEBPACK_ELECTRON_ENTRY_PRELOAD: path.join(__dirname, '../lib/preload/devSetup.js')
    },
    watch: true,
    watchOptions: { aggregateTimeout: Math.max(+AUTO_RELAUNCH_DELAY || 0, 2000) },
    beforeWatchRun: () => log.info('Compiling the main files for changes... '),
    afterWatchRun: () => {
      sendRecompileRequest(indexURL)
      if (AUTO_RELAUNCH_APP !== 'false' && electron && electron.pid) {
        electron.restart()
      }
    }
  })
  main.then(() => log.info('Watching the main files for updates...'))

  // 等待主进程和渲染进程代码构建完成
  await Promise.all([main, wait({ resources: [indexURL], delay: 3000 })])

  // Electron
  if (AUTO_LAUNCH_APP === 'false') {
    log.warn('Auto launch electron app is disabled')
    return
  }
  electron = runScript({
    logger: createPrefixedLogger('electron', LOG_PREFIX_COLOR_ELECTRON),
    env: { APP_INDEX_HTML_URL: indexURL },
    script: require('electron'),
    args: ['.'],
    windowsHide: false,
    beforeExit
  })
    .on('restart', () => log.info('Relaunched the Electron.app'))
    .start()

  log.info('Launched the Electron.app')
}

function sendRecompileRequest(host) {
  // 需要renderer进程来进行全局的typescript类型检查
  fetch(`${host}/webpack-dev-server/invalidate?${Date.now()}`, {
    method: 'GET',
    cache: 'no-cache'
  }).catch(log.error)
}
