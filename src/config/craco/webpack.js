const { resolveModule, resolveModulePath } = require('../../lib/resolve')

const webpack = resolveModule('webpack')

const {
  RENDERER_CONTEXT,
  RENDERER_CONTEXT_ALIAS,
  RENDERER_ENTRY,
  RENDERER_BUILD_PATH,
  THEME_PLUGIN_OPTIONS,
  LOCALE_PLUGIN_OPTIONS,
  RENDERER_PRELOAD,
  RENDERER_PUBLIC_ASSETS
} = require('../index')

const {
  RENDERER_BUILD_TARGET,
  ENABLE_NODE_ADDONS = 'false',
  ENABLE_BUNDLE_ANALYZER = 'false',
  ENABLE_CHECK_NODE_PATHS = 'true'
} = process.env

if (!/^(web|electron-renderer)$/.test(RENDERER_BUILD_TARGET)) {
  throw new Error('Renderer build target must set to web or electron-renderer')
}

const isEnvProduction = process.env.NODE_ENV === 'production'
const target = RENDERER_BUILD_TARGET

const getOptionalPlugin = (options, module) => {
  if (!options) {
    return null
  }
  let moduleName
  let dependency
  switch (module) {
    case 'locale':
      moduleName = '@ices/locale-webpack-plugin'
      dependency = '@ices/react-locale'
      break
    case 'theme':
      moduleName = '@ices/theme-webpack-plugin'
      dependency = options.themeExportPath ? '' : '@ices/theme'
      break
    default:
      moduleName = module
      dependency = ''
  }
  if (dependency && !resolveModulePath(dependency, false)) {
    // 没有安装依赖模块，不使用该插件
    return null
  }
  const Plugin = require(moduleName)
  return new Plugin(options)
}

//
const customizeWebpackConfig = {
  target,
  entry: {
    index: [RENDERER_PRELOAD, RENDERER_ENTRY].filter(Boolean)
  },
  output: { path: RENDERER_BUILD_PATH },
  resolve: {
    alias: RENDERER_CONTEXT_ALIAS
      ? {
          [RENDERER_CONTEXT_ALIAS]: RENDERER_CONTEXT
        }
      : {}
  },
  // 这是个publicAssets是自定义的属性，并不属于webpack配置项
  // 用于修改public静态资源目录，CracoPlugin 会处理这个属性
  publicAssets: RENDERER_PUBLIC_ASSETS,
  plugins: [
    // 支持node addon的构建与打包
    // 注意，node addon仅在渲染模块以electron-renderer模式打包时可用
    getOptionalPlugin(ENABLE_NODE_ADDONS !== 'false' && {}, '../../lib/plugins/NodeAddonsPlugin'),

    // 分析包
    getOptionalPlugin(
      isEnvProduction && ENABLE_BUNDLE_ANALYZER !== 'false' && {},
      '../../lib/plugins/BundleAnalyzerPlugin'
    ),

    // 检查__dirname和__filename变量的使用，并抛出编译错误
    getOptionalPlugin(
      ENABLE_CHECK_NODE_PATHS !== 'false' && {},
      '../../lib/plugins/CheckGlobalPathsPlugin'
    ),

    // 本地化模块插件
    getOptionalPlugin(LOCALE_PLUGIN_OPTIONS, 'locale'),

    // 主题化插件
    getOptionalPlugin(THEME_PLUGIN_OPTIONS, 'theme'),

    //
    new webpack.EnvironmentPlugin({
      IS_ELECTRON: target !== 'web'
    })
  ].filter(Boolean)
}

//
module.exports = {
  configure: customizeWebpackConfig
}
