const path = require('path')
const fs = require('fs')
const { reactScripts, viteService, vueCLIService } = require('../lib/resolve')

const cwd = fs.realpathSync(process.cwd())
const resolve = (...args) => path.join(cwd, ...args)

// 加载外部配置项
function loadConfig(config) {
  const buildConfig = {}
  if (config && typeof config === 'object') {
    const hasOwnProperty = Object.prototype.hasOwnProperty
    const items = [
      ['appBuildPath', 'APP_BUILD_PATH', 'string', 'absolutePath'],
      ['mainBuildPath', 'MAIN_BUILD_PATH', 'string', 'absolutePath'],
      ['rendererBuildPath', 'RENDERER_BUILD_PATH', 'string', 'absolutePath'],
      ['addonsBuildPath', 'ADDONS_BUILD_PATH', 'string', 'absolutePath'],
      ['rendererContextAlias', 'RENDERER_CONTEXT_ALIAS', 'string'],
      ['rendererContext', 'RENDERER_CONTEXT', 'string', 'absolutePath'],
      ['rendererEntry', 'RENDERER_ENTRY', 'string', 'absolutePath'],
      ['rendererPublicAssets', 'RENDERER_PUBLIC_ASSETS', 'string', 'absolutePath'],
      ['mainContextAlias', 'MAIN_CONTEXT_ALIAS', 'string'],
      ['mainContext', 'MAIN_CONTEXT', 'string', 'absolutePath'],
      ['mainEntry', 'MAIN_ENTRY', 'string', 'absolutePath'],
      ['mainBuildFileName', 'MAIN_BUILD_FILE_NAME', 'string'],
      ['cssModuleLocalIdentName', 'CSS_MODULE_LOCAL_IDENT_NAME', 'string'],
      ['themePlugin', 'THEME_PLUGIN_OPTIONS', 'object'],
      ['localePlugin', 'LOCALE_PLUGIN_OPTIONS', 'object'],
      ['mainPreloadFile', 'MAIN_PRELOAD', 'string', 'absolutePath'],
      ['rendererPreloadFile', 'RENDERER_PRELOAD', 'string', 'absolutePath']
    ]
    for (const [prop, configName, valueType, configType] of items) {
      if (hasOwnProperty.call(config, prop)) {
        let value = config[prop]
        if (typeof value !== valueType) {
          throw new Error(`The type of value for ${prop} option must be a ${valueType}`)
        }
        if (configType === 'absolutePath') {
          if (!value) {
            continue
          }
          if (!path.isAbsolute(value)) {
            value = resolve(value)
          }
        }
        buildConfig[configName] = value
      }
    }
  }
  return buildConfig
}

// 解析模块文件路径
const resolveModule = (
  filePath,
  extensions = [
    'js',
    'ts',
    'jsx',
    'tsx',
    'vue',
    'web.js',
    'web.mjs',
    'web.ts',
    'web.jsx',
    'web.tsx',
    'mjs'
  ]
) => {
  for (const ext of extensions) {
    const file = resolve(`${filePath}.${ext}`)
    if (fs.existsSync(file)) {
      return file
    }
  }
  return resolve(`${filePath}.js`)
}

// 获取主进程入口文件
function getMainEntry(filepath) {
  const file = resolveModule(filepath, ['js', 'ts', 'mjs', 'cjs'])
  if (fs.existsSync(file)) {
    return file
  }
  return path.join(__dirname, '../electron/main.js')
}

// react-scripts 默认配置项
function getReactScriptsDefaultConfig() {
  return {
    // 应用构建输出路径，该目录会作为app打包发布
    APP_BUILD_PATH: resolve('build/'),
    // 相关资源的输出路径，需要在打包目录下
    MAIN_BUILD_PATH: resolve('build/main/'),
    RENDERER_BUILD_PATH: resolve('build/renderer/'),
    ADDONS_BUILD_PATH: resolve('build/addons/'),
    // renderer
    RENDERER_CONTEXT_ALIAS: '@',
    RENDERER_CONTEXT: resolve('src/'),
    RENDERER_ENTRY: resolveModule('src/index'),
    RENDERER_PUBLIC_ASSETS: resolve('public/'),
    // main
    MAIN_CONTEXT_ALIAS: '#',
    MAIN_CONTEXT: resolve('src/'),
    MAIN_ENTRY: getMainEntry('src/main'),
    MAIN_BUILD_FILE_NAME: 'index.js',
    // misc
    CSS_MODULE_LOCAL_IDENT_NAME: '[local]_[hash:base64:5]',
    THEME_PLUGIN_OPTIONS: null,
    LOCALE_PLUGIN_OPTIONS: null,
    MAIN_PRELOAD: '',
    RENDERER_PRELOAD: ''
  }
}

// vue-cli-service默认配置项
function getVueCLIServiceDefaultConfig() {
  return {
    // 应用构建输出路径，该目录会作为app打包发布
    APP_BUILD_PATH: resolve('build/'),
    // 相关资源的输出路径，需要在打包目录下
    MAIN_BUILD_PATH: resolve('build/main/'),
    RENDERER_BUILD_PATH: resolve('build/renderer/'),
    ADDONS_BUILD_PATH: resolve('build/addons/'),
    // renderer
    RENDERER_CONTEXT_ALIAS: '@',
    RENDERER_CONTEXT: resolve('src/renderer/'),
    RENDERER_ENTRY: resolve('src/renderer/index.tsx'),
    RENDERER_PUBLIC_ASSETS: resolve('public/web/'),
    // main
    MAIN_CONTEXT_ALIAS: '#',
    MAIN_CONTEXT: resolve('src/main/'),
    MAIN_ENTRY: resolve('src/main/index.ts'),
    MAIN_BUILD_FILE_NAME: 'index.js',
    // misc
    CSS_MODULE_LOCAL_IDENT_NAME: '[local]_[hash:base64:5]',
    THEME_PLUGIN_OPTIONS: { extract: false, themes: ['src/renderer/themes/*.scss'] },
    LOCALE_PLUGIN_OPTIONS: { extract: false },
    MAIN_PRELOAD: '',
    RENDERER_PRELOAD: ''
  }
}

// 获取默认配置项
function getDefaultConfig() {
  if (reactScripts.context) {
    return getReactScriptsDefaultConfig()
  }
  if (vueCLIService.context || viteService.context) {
    return getVueCLIServiceDefaultConfig()
  }
  return {}
}

// 获取配置项
function getConfig() {
  let config
  let configFile = path.resolve('itron.config.js')
  if (!fs.existsSync(configFile)) {
    config = loadConfig(require(path.resolve('package.json'))['itron'])
  } else {
    config = loadConfig(require(configFile))
  }
  return config
}

// 定义构建相关的路径参数等
module.exports = Object.assign({}, getDefaultConfig(), getConfig())
