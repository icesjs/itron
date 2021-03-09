//
require('../lib/setup')('production', {
  // 这些环境变量强制被使用
  ENABLE_PRODUCTION_DEBUG: 'false',
  ENABLE_BUNDLE_ANALYZER: 'false',
  GENERATE_FULL_SOURCEMAP: 'false',
  GENERATE_SOURCEMAP: 'false',
  // DEBUG命名空间强制为构建相关命名
  DEBUG: `${process.env.npm_package_name}:*,electron-builder`
})

const path = require('path')
const fs = require('fs-extra')
const { promisify } = require('util')
const yaml = require('js-yaml')
const merge = require('deepmerge')
const { log, createPrefixedLogger } = require('../lib/logger')
const {
  relativePath,
  emptyDirSync,
  printErrorAndExit,
  getPackageJson,
  getSelfContext
} = require('../lib/utils')
const { runScript } = require('../lib/runner')
const {
  APP_BUILD_PATH,
  MAIN_BUILD_PATH,
  RENDERER_BUILD_PATH,
  ADDONS_BUILD_PATH
} = require('../config')
//
const {
  ELECTRON_MAIN_ENTRY_PATH,
  ELECTRON_HEADERS_MIRROR_URL,
  ENABLE_NODE_ADDONS,
  ELECTRON_BUILDER_CONFIG = 'pack.yml',
  CI = 'false'
} = process.env

async function run(commandArgs = {}) {
  const taskNames = ['rebuild-app-deps', 'build-production', 'pack-resources']
  createPrefixedLogger.registerNames(taskNames)

  log.info('Command arguments:')
  log.info(commandArgs)

  // 清理构建输出目录
  emptyDirSync(APP_BUILD_PATH)

  if (ENABLE_NODE_ADDONS !== 'false') {
    log.info('Rebuild native addons for current platform...')
    // 构建本地插件
    await rebuildNativeModules({
      ...commandArgs,
      logger: createPrefixedLogger(taskNames[0], 'yellow')
    })
  } else {
    taskNames.shift()
  }

  log.info('Build app resources...')
  // 编译构建
  await buildResources({
    ...commandArgs,
    logger: createPrefixedLogger(taskNames[1], 'red', (s) => s)
  })

  log.info('Package app resources...')
  // 打包产品
  await packApplication({
    ...commandArgs,
    logger: createPrefixedLogger(taskNames[2], 'blue')
  })

  // 打包成功
  log.info('Packaged successfully!')
}

// 初始化默认选项
function initDefaultOptions(options) {
  const { platform, arch, config, publish, rebuild, dir } = Object.assign(
    {
      platform: process.platform,
      arch: process.arch,
      config: ELECTRON_BUILDER_CONFIG,
      publish: null,
      rebuild: false,
      dir: false
    },
    options
  )
  return { platform, arch, config, publish, rebuild, dir }
}

function noop() {}

function getElectronVersion() {
  return require('electron/package.json').version
}

// 重新编译本地插件
async function rebuildNativeModules({ arch, logger, rebuild }) {
  const electronVersion = getElectronVersion()
  const args = ['--types', 'prod', '--version', electronVersion]
  if (arch) {
    args.push('--arch', arch)
  }
  if (CI !== 'false' || rebuild) {
    args.push('--force')
  }
  if (ELECTRON_HEADERS_MIRROR_URL) {
    args.push('--dist-url', ELECTRON_HEADERS_MIRROR_URL)
  }
  await runScript({
    exitHandle: noop,
    logger,
    script: 'electron-rebuild',
    args
  })
}

// 编译构建
async function buildResources({ logger }) {
  await runScript({
    exitHandle: noop,
    script: path.join(__dirname, 'build.js'),
    logger
  })
}

// 打包产品
async function packApplication({ platform, arch, dir, logger, publish, config }) {
  config = await resolveConfigFile(config)
  // 同步打包配置文件
  await synchronizeBuilderConfig(config, { dir, publish })
  const args = ['build']
  const platformArg = {
    darwin: '--mac',
    win32: '--win',
    linux: '--linux'
  }[platform]
  if (platformArg) {
    args.push(platformArg)
  }
  if (arch) {
    args.push(`--${arch}`)
  }
  args.push('--config', config)
  await runScript({
    exitHandle: noop,
    logger,
    script: 'electron-builder',
    args
  })
}

// 创建临时配置文件
async function resolveConfigFile(config) {
  const configFile = config && typeof config === 'string' ? path.resolve(config) : ''
  const tmpConfigFile = path.resolve('node_modules/.app/electron-builder.yml')
  let content
  if (!configFile || !fs.existsSync(configFile)) {
    let config
    const { build, name = 'Itron' } = getPackageJson()
    if (build && typeof build === 'object') {
      config = build
    } else {
      const context = getSelfContext()
      const base = path.join(context, 'resources')
      const publicBase = path.join(base, 'public')
      const content = await promisify(fs.readFile)(path.join(base, 'pack.yml'), 'utf8')
      config = yaml.load(content)
      config = merge(config, {
        productName: name.replace(/[/\\]/g, '_'),
        dmg: {
          icon: path.join(publicBase, 'icon.dmg.icns')
        },
        mac: {
          entitlements: path.join(publicBase, 'entitlements.mac.plist'),
          entitlementsInherit: path.join(publicBase, 'entitlements.mac.plist'),
          icon: path.join(publicBase, 'icon.icns')
        },
        win: {
          icon: path.join(publicBase, 'icon.ico')
        },
        linux: {
          icon: path.join(__dirname, 'icon.png')
        }
      })
    }
    content = yaml.dump(config)
  } else {
    content = await promisify(fs.readFile)(configFile, 'utf8')
  }
  await fs.outputFile(tmpConfigFile, content)
  return relativePath(process.cwd(), tmpConfigFile)
}

async function synchronizeBuilderConfig(filepath, { dir, publish }) {
  const cwd = process.cwd()
  const enableAddons = ENABLE_NODE_ADDONS !== 'false'
  const mainFile = ELECTRON_MAIN_ENTRY_PATH
  const buildDir = relativePath(cwd, APP_BUILD_PATH, false)
  const mainDir = relativePath(APP_BUILD_PATH, MAIN_BUILD_PATH, false)
  const rendererDir = relativePath(APP_BUILD_PATH, RENDERER_BUILD_PATH, false)
  const addonsDir = enableAddons ? relativePath(APP_BUILD_PATH, ADDONS_BUILD_PATH, false) : ''
  const relativeBuildMainFile = relativePath(APP_BUILD_PATH, mainFile, false)

  // 同步打包配置
  await writeBuilderConfig(filepath, {
    publish,
    asar: !dir,
    extends: null,
    npmRebuild: false,
    electronVersion: getElectronVersion(),
    directories: {
      app: `${buildDir}/`,
      buildResources: `${buildDir}/`
    },
    // 文件路径都是相对构建目录
    files: [
      ...new Set(
        [
          '!*.{js,css}.map',
          'package.json',
          relativeBuildMainFile,
          `${mainDir}/**/*`,
          `${rendererDir}/**/*`,
          addonsDir && `${addonsDir}/**/*`
        ].filter(Boolean)
      )
    ],
    extraMetadata: {
      main: relativeBuildMainFile
    }
  })
}

async function writeBuilderConfig(filepath, updates) {
  const configPath = path.resolve(filepath)
  const content = await promisify(fs.readFile)(configPath, 'utf8')
  const config = yaml.load(content)
  const updatedConfig = merge(config, updates, {
    arrayMerge: (dest, src) => src
  })
  const dumped = yaml.dump(updatedConfig)
  await fs.outputFile(configPath, dumped)
  return updatedConfig
}

module.exports = (options) => run(initDefaultOptions(options)).catch(printErrorAndExit)
