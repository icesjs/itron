//
const path = require('path')
const StyleLintPlugin = require('stylelint-webpack-plugin')
const { resolvePackage } = require('../scripts/lib/resolve')
const webpack = resolvePackage('webpack')

const {
  RENDERER_CONTEXT,
  RENDERER_CONTEXT_ALIAS,
  RENDERER_ENTRY,
  RENDERER_BUILD_PATH,
} = require('./consts')
const cwd = process.cwd()

const { RENDERER_BUILD_TARGET } = process.env
const RENDERER_PRELOAD = path.join(__dirname, 'preload.renderer.js')
const target = !/^(web|electron-renderer)$/.test(RENDERER_BUILD_TARGET)
  ? 'electron-renderer'
  : RegExp.$1

//
const customizeWebpackConfig = {
  target,
  entry: {
    index: [RENDERER_PRELOAD, RENDERER_ENTRY],
  },
  output: { path: RENDERER_BUILD_PATH },
  resolve: {
    alias: {
      [RENDERER_CONTEXT_ALIAS]: RENDERER_CONTEXT,
    },
  },
  // 这是个publicAssets是自定义的属性，并不属于webpack配置项
  // 用于修改public静态资源目录，craco.plugin.js插件会处理这个属性
  publicAssets: path.resolve('public/web/'),
  plugins: [
    new StyleLintPlugin({
      configBasedir: cwd,
      context: RENDERER_CONTEXT,
      files: ['**/*.{css,scss}'],
    }),
    new webpack.EnvironmentPlugin({
      IS_ELECTRON: target !== 'web',
    }),
  ],
}

//
module.exports = {
  configure: customizeWebpackConfig,
}
