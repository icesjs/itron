//
const LocaleWebpackPlugin = require('@ices/locale-webpack-plugin')
const ThemeWebpackPlugin = require('@ices/theme-webpack-plugin')
const NodeAddonsPlugin = require('../../lib/plugins/NodeAddonsPlugin')
const CheckGlobalPathsPlugin = require('../../lib/plugins/CheckGlobalPathsPlugin')
const BundleAnalyzerPlugin = require('../../lib/plugins/BundleAnalyzerPlugin')
const { resolveModule } = require('../../lib/resolve')

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
  ENABLE_BUNDLE_ANALYZER = 'false'
} = process.env

if (!/^(web|electron-renderer)$/.test(RENDERER_BUILD_TARGET)) {
  throw new Error('Renderer build target must set to web or electron-renderer')
}

const isEnvProduction = process.env.NODE_ENV === 'production'
const target = RENDERER_BUILD_TARGET

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
  // 用于修改public静态资源目录，craco.plugin.js插件会处理这个属性
  publicAssets: RENDERER_PUBLIC_ASSETS,
  plugins: [
    // 支持node addon的构建与打包
    // 注意，node addon仅在渲染模块以electron-renderer模式打包时可用
    ENABLE_NODE_ADDONS !== 'false' && new NodeAddonsPlugin(),
    isEnvProduction && ENABLE_BUNDLE_ANALYZER !== 'false' && new BundleAnalyzerPlugin(),
    // 检查__dirname和__filename变量的使用，并抛出编译错误
    new CheckGlobalPathsPlugin(),
    // 本地化模块插件
    LOCALE_PLUGIN_OPTIONS && new LocaleWebpackPlugin(LOCALE_PLUGIN_OPTIONS),
    // 主题化插件
    THEME_PLUGIN_OPTIONS && new ThemeWebpackPlugin(THEME_PLUGIN_OPTIONS),
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
