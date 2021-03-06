// setup需要最先执行
require('../lib/setup')('production')
//

const path = require('path')
const { promisify } = require('util')
const fs = require('fs-extra')
const wait = require('wait-on')
const { log, createPrefixedLogger } = require('../lib/logger')
const {
  relativePath,
  getPackageJson,
  getAvailablePort,
  getCommitHEAD,
  printErrorAndExit
} = require('../lib/utils')
const { runScript, runWebpack } = require('../lib/runner')
const builder = require('../builder')

const { RENDERER_BUILD_PATH, MAIN_BUILD_PATH, APP_BUILD_PATH } = require('../config')

// 运行构建
async function run() {
  const {
    LOG_PREFIX_COLOR_MAIN,
    LOG_PREFIX_COLOR_RENDERER,
    LOG_PREFIX_COLOR_ELECTRON,
    ENABLE_PRODUCTION_DEBUG = 'false',
    ENABLE_BUNDLE_ANALYZER = 'false'
  } = process.env
  const absIndexPath = path.resolve(RENDERER_BUILD_PATH, 'index.html')
  const relIndexPath = relativePath(MAIN_BUILD_PATH, absIndexPath)
  const hasAnalyzerServer = ENABLE_BUNDLE_ANALYZER !== 'false'
  const ANALYZER_SERVER_PORT = hasAnalyzerServer
    ? await Promise.all([getAvailablePort(5010), getAvailablePort(5000)])
    : []
  const { env, script, args } = builder('build', { ANALYZER_SERVER_PORT: ANALYZER_SERVER_PORT[0] })

  // Renderer
  const renderer = runScript({
    logger: createPrefixedLogger('renderer', LOG_PREFIX_COLOR_RENDERER),
    exitHandle: (code) => code !== 0 && process.exit(code),
    script,
    env,
    args
  }).start()

  // Main
  const main = runWebpack({
    logger: createPrefixedLogger('main', LOG_PREFIX_COLOR_MAIN),
    config: path.join(__dirname, '../config/electron.webpack.js'),
    env: {
      APP_INDEX_HTML_PATH: relIndexPath,
      ANALYZER_SERVER_PORT: ANALYZER_SERVER_PORT[1],
      WEBPACK_ELECTRON_ENTRY_PRELOAD: path.join(__dirname, '../lib/preload/prodSetup.js')
    }
  })

  await Promise.all([
    main,
    hasAnalyzerServer
      ? wait({ resources: [`http-get://localhost:${ANALYZER_SERVER_PORT[0]}`], delay: 3000 })
      : renderer,
    createPackageJson()
  ])

  if (ENABLE_PRODUCTION_DEBUG !== 'false') {
    // Electron
    runScript({
      logger: createPrefixedLogger('electron', LOG_PREFIX_COLOR_ELECTRON),
      script: require('electron'),
      args: [path.resolve('node_modules/.app/index.js')],
      windowsHide: false,
      cwd: APP_BUILD_PATH
    }).start()
    log.info('Launched the Electron.app for debugging production')
  }
}

// 生成打包用的package.json
async function createPackageJson() {
  const { name, version } = getPackageJson()
  const mainFile = process.env.ELECTRON_MAIN_ENTRY_PATH
  const main = relativePath(APP_BUILD_PATH, mainFile, false)
  await promisify(fs.outputFile)(
    path.resolve(APP_BUILD_PATH, 'package.json'),
    JSON.stringify(
      {
        name,
        version,
        commit: await getCommitHEAD().catch((err) => {
          log.error(err)
          return ''
        }),
        main,
        private: true
      },
      null,
      2
    )
  )
}

if (require.main === module) {
  // 从命令行进入
  run().catch(printErrorAndExit)
}

module.exports = (options) => run(options).catch(printErrorAndExit)
