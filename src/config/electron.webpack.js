const path = require('path')
const { merge } = require('webpack-merge')
const { resolveModule: resolve, resolveModulePath: resolvePath } = require('../lib/resolve')
const {
  updateJsonFile,
  isTypeScriptProject,
  getSelfContext,
  getOptionalPlugin
} = require('../lib/utils')

//
const webpack = resolve('webpack')
const TerserPlugin = resolve('terser-webpack-plugin')

const {
  MAIN_ENTRY,
  MAIN_BUILD_PATH,
  MAIN_BUILD_FILE_NAME,
  MAIN_CONTEXT,
  MAIN_CONTEXT_ALIAS,
  MAIN_PRELOAD,
  mainWebpackConfig
} = require('./index')
const context = process.cwd()

const {
  NODE_ENV,
  APP_INDEX_HTML_URL,
  APP_INDEX_HTML_PATH,
  APP_DEV_LOG_LEVEL,
  APP_PRO_LOG_LEVEL,
  RENDERER_BUILD_TARGET,
  WEBPACK_ELECTRON_ENTRY_PRELOAD,
  GENERATE_FULL_SOURCEMAP = 'false',
  GENERATE_SOURCEMAP = 'false',
  ENABLE_NODE_ADDONS = 'false',
  ENABLE_BUNDLE_ANALYZER = 'false',
  ENABLE_CHECK_NODE_PATHS = 'true'
} = process.env

const isEnvDevelopment = NODE_ENV === 'development'
const isEnvProduction = NODE_ENV === 'production'
const useTypeScript = isTypeScriptProject()
const mode = isEnvDevelopment ? 'development' : 'production'
const enableAddons = ENABLE_NODE_ADDONS !== 'false'
const shouldUseSourceMap = GENERATE_SOURCEMAP !== 'false'
const selfContext = getSelfContext()

if (useTypeScript) {
  // 同步更新sourceMap开关
  updateJsonFile(
    'tsconfig.json',
    {
      compilerOptions: { sourceMap: isEnvDevelopment || shouldUseSourceMap }
    },
    false
  )
}

const defaultConfig = {
  mode,
  context,
  target: 'electron-main',

  entry: [WEBPACK_ELECTRON_ENTRY_PRELOAD, MAIN_PRELOAD, MAIN_ENTRY].filter(Boolean),

  output: {
    path: MAIN_BUILD_PATH,
    filename: MAIN_BUILD_FILE_NAME
  },

  resolve: {
    extensions: ['.ts', '.mjs', '.js', '.json'],
    alias: MAIN_CONTEXT_ALIAS
      ? {
          [MAIN_CONTEXT_ALIAS]: MAIN_CONTEXT
        }
      : {}
  },

  devtool: isEnvDevelopment
    ? GENERATE_FULL_SOURCEMAP !== 'false'
      ? 'source-map'
      : 'eval-source-map'
    : shouldUseSourceMap && 'source-map',

  bail: isEnvProduction,

  module: {
    strictExportPresence: true,
    rules: [
      { parser: { requireEnsure: false } },
      {
        oneOf: [
          useTypeScript
            ? {
                test: /\.(?:ts|mjs|js)$/,
                loader: resolvePath('ts-loader', true, [selfContext]),
                include: path.resolve(context, 'src'),
                options: {
                  transpileOnly: true
                }
              }
            : {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                  loader: resolvePath('babel-loader'),
                  options: require(path.join(selfContext, 'babel.config.js'))
                }
              },
          {
            loader: resolvePath('file-loader', true, [selfContext]),
            exclude: /\.(?:json|m?js|ts|node)$/,
            options: {
              name: 'media/[name].[hash:8].[ext]',
              publicPath: '.',
              // 转换资源的相对路径为绝对路径
              postTransformPublicPath: (path) =>
                `__non_webpack_require__('path').join(__dirname, ${path})`
            }
          }
        ]
      }
    ].filter(Boolean)
  },

  optimization: {
    minimize: !(isEnvDevelopment || GENERATE_FULL_SOURCEMAP !== 'false'),
    minimizer: [
      new TerserPlugin({
        sourceMap: shouldUseSourceMap,
        terserOptions: {
          ecma: 2018
        }
      })
    ]
  },

  node: {
    __dirname: false,
    __filename: false
  },

  plugins: [
    getOptionalPlugin(
      isEnvDevelopment,
      // 路径大小写敏感检查
      () => resolve('case-sensitive-paths-webpack-plugin', false)
    ),

    getOptionalPlugin(
      isEnvProduction,
      // 清理构建目录
      () => require('clean-webpack-plugin').CleanWebpackPlugin
    ),

    // 分析包
    getOptionalPlugin(
      isEnvProduction && ENABLE_BUNDLE_ANALYZER !== 'false',
      'BundleAnalyzerPlugin'
    ),

    // 支持node addon的构建与打包
    getOptionalPlugin(enableAddons, 'NodeAddonsPlugin'),

    // 检查__dirname和__filename变量的使用，抛出编译错误
    getOptionalPlugin(
      // 使用file-loader对路径进行了绝对化处理，其中使用了__dirname，不需要进行检查
      ENABLE_CHECK_NODE_PATHS !== 'false' && {
        ignoredLoaders: 'file-loader'
      },
      'CheckGlobalPathsPlugin'
    ),

    //
    new webpack.EnvironmentPlugin({
      NODE_ENV: mode,
      IS_ELECTRON: true,
      ELECTRON_APP_DEV_LOG_LEVEL: APP_DEV_LOG_LEVEL,
      ELECTRON_APP_PRO_LOG_LEVEL: APP_PRO_LOG_LEVEL,
      ELECTRON_APP_NODE_INTEGRATION: RENDERER_BUILD_TARGET === 'electron-renderer',
      ...(APP_INDEX_HTML_URL ? { ELECTRON_APP_INDEX_HTML_URL: APP_INDEX_HTML_URL } : {}),
      ...(APP_INDEX_HTML_PATH ? { ELECTRON_APP_INDEX_HTML_PATH: APP_INDEX_HTML_PATH } : {})
    })
  ].filter(Boolean),

  stats: {
    all: false,
    colors: true,
    warnings: true,
    errors: true,
    errorDetails: true,
    context: MAIN_CONTEXT,
    ...(isEnvDevelopment
      ? {
          entrypoints: true
        }
      : {
          assets: true,
          env: true
        })
  },

  performance: false
}

//
module.exports = merge(defaultConfig, Object.assign({}, mainWebpackConfig))
