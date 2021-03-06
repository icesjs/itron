const fs = require('fs-extra')
const path = require('path')

//
function catchUncaughtException(log) {
  process.on('unhandledRejection', (reason) => log.error(reason))
  process.on('uncaughtException', (err) => {
    log.error(err)
    process.exit(1)
  })
}

//
function getReady() {
  // init logger
  const log = require('./logger').log
  // 捕获全局异常
  catchUncaughtException(log)

  // 清理相关文件与目录
  const { relativePath, emptyDirSync } = require('./utils')
  const { MAIN_BUILD_PATH, MAIN_BUILD_FILE_NAME, ADDONS_BUILD_PATH } = require('../config')
  const main = path.resolve(MAIN_BUILD_PATH, MAIN_BUILD_FILE_NAME)
  const tmpAppDir = path.resolve('node_modules/.app')

  // 非打包时，electron命令运行的入口脚本路径
  fs.outputFileSync(
    path.join(tmpAppDir, 'index.js'),
    `require('${relativePath(tmpAppDir, main)}')\n`
  )
  // 打包成应用后用到的入口文件路径
  process.env.ELECTRON_MAIN_ENTRY_PATH = path.resolve(relativePath(process.cwd(), main))

  if (process.env.ENABLE_NODE_ADDONS !== 'false') {
    // 清空addons构建输出目录
    emptyDirSync(ADDONS_BUILD_PATH)
  }
}

function loadEnv(NODE_ENV, forced) {
  const dotenv = require('./env/dotenv')
  const envFromConfig = Object.assign(
    {
      DEBUG: `${require(path.resolve('package.json')).name}:*`
    },
    dotenv.parseEnv(NODE_ENV)
  )

  const envFromProcess = process.env

  Object.assign(envFromConfig, { FORCE_COLOR: 2 }, forced)
  for (const [name, value] of Object.entries(envFromConfig)) {
    const processEnvHasProp = envFromProcess.hasOwnProperty(name)
    const processEnv = envFromProcess[name]
    if (value && value !== 'undefined') {
      // 仅设置环境变量中未声明的值
      if (processEnvHasProp && processEnv && processEnv !== 'undefined') {
        continue
      }
      envFromProcess[name] = value
    } else if (processEnvHasProp && (!processEnv || processEnv === 'undefined')) {
      delete envFromProcess[name]
    }
  }
  Object.assign(envFromProcess, { NODE_ENV })
}

function presetEnv() {
  const { CI } = process.env
  if (CI && CI !== 'false') {
    Object.assign(process.env, {
      NO_COLOR: 'true',
      WRITE_LOGS_TO_FILE: 'false'
    })
  } else {
    delete process.env.CI
  }
  const {
    ENABLE_PRODUCTION_DEBUG = 'false',
    GENERATE_FULL_SOURCEMAP = 'false',
    NO_COLOR = 'false',
    DEBUG = 'false'
  } = process.env

  if (ENABLE_PRODUCTION_DEBUG !== 'false' || GENERATE_FULL_SOURCEMAP !== 'false') {
    process.env.GENERATE_SOURCEMAP = 'true'
  }
  if (NO_COLOR !== 'false') {
    delete process.env.FORCE_COLOR
  } else {
    delete process.env.NO_COLOR
  }
  if (DEBUG === 'false') {
    delete process.env.DEBUG
  }
}

function setEnvironment(NODE_ENV, forced) {
  loadEnv(NODE_ENV, forced)
  presetEnv()
  getReady()
}

module.exports = setEnvironment
