//
module.exports = {
  //
  overrideCracoConfig({ cracoConfig }) {
    const { webpack = {} } = cracoConfig
    const { configure } = webpack || {}
    if (configure !== null && typeof configure === 'object') {
      webpack.configure = customizeCracoWebpackConfigure(configure)
    }
    return cracoConfig
  },

  //
  overrideWebpackConfig({ webpackConfig }) {
    overridePublicPath(webpackConfig)
    customizeOptimization(webpackConfig)
    return webpackConfig
  }
}

const path = require('path')
const { mergeWithCustomize } = require('webpack-merge')
const { resolveModule, reactScripts } = require('../resolve')
const cwd = process.cwd()

//
function customizeCracoWebpackConfigure(customizeConfig = {}) {
  return (originalConfig, context) => {
    overrideEntry(context, originalConfig, customizeConfig)
    overrideOutputPath(context, customizeConfig)
    overridePublicAssetsPath(context, originalConfig, customizeConfig)
    //
    return mergeWithCustomize({
      customizeObject(a, b, key) {},
      customizeArray(a, b, key) {}
    })(originalConfig, customizeConfig)
  }
}

function overridePublicPath(config) {
  const { output = {} } = config
  output.publicPath = './'
  config.output = output
}

function overridePublicAssetsPath(context, originalConfig, customizeConfig) {
  const { publicAssets } = customizeConfig
  if (typeof publicAssets !== 'undefined') {
    delete customizeConfig.publicAssets
    const template = path.join(publicAssets, 'index.html')
    if (publicAssets !== context.paths['appPublic']) {
      overrideHtmlWebpackPluginForPublicAssets(template, originalConfig)
      overrideCRAPaths(context, 'appPublic', publicAssets)
      overrideCRAPaths(context, 'appHtml', template)
    }
  }
}

function customizeOptimization(webpackConfig) {
  const { optimization = {} } = webpackConfig
  const { GENERATE_FULL_SOURCEMAP } = process.env
  if (GENERATE_FULL_SOURCEMAP !== 'false') {
    optimization.minimize = false
    webpackConfig.optimization = optimization
  }
}

//
function overrideEntry(context, originalConfig, customizeConfig) {
  let customizeEntry = customizeConfig.entry
  if (customizeEntry && JSON.stringify(customizeEntry) !== JSON.stringify(originalConfig.entry)) {
    let chunkName
    if (typeof customizeEntry === 'object') {
      const keys = Object.keys(customizeEntry)
      if (!keys.length) {
        delete customizeConfig.entry
        return
      }
      if (keys.length > 1) {
        throw new Error('Does not support the creation of multi-page entry applications')
      }
      chunkName = keys[0]
      customizeEntry = customizeEntry[chunkName]
    }
    if (Array.isArray(originalConfig.entry)) {
      // ????????????????????????hmr??????entry??????
      const replaced = Array.isArray(customizeEntry) ? customizeEntry : [customizeEntry]
      originalConfig.entry.splice(-1, 1, ...replaced)
    } else {
      // ????????????????????????react v17??????fast refresh
      originalConfig.entry = customizeEntry
    }
    delete customizeConfig.entry
    if (chunkName) {
      originalConfig.entry = { [chunkName]: originalConfig.entry }
      overrideManifestPluginForEntry(chunkName, originalConfig)
    }
    overrideCRAPaths(
      context,
      'appIndexJs',
      Array.isArray(customizeEntry) ? customizeEntry[customizeEntry.length - 1] : customizeEntry
    )
  }
}

//
function overrideOutputPath(context, customizeConfig) {
  if (customizeConfig.output) {
    const outputPath = customizeConfig.output.path
    if (outputPath) {
      overrideCRAPaths(context, 'appBuild', outputPath)
    }
  }
}

//
function overrideCRAPaths({ paths }, prop, val) {
  const ownPath = paths['ownPath'] || reactScripts.context
  if (!ownPath) {
    return
  }
  const modulePath = require.resolve(path.join(ownPath, 'config', 'paths.js'), {
    paths: [cwd]
  })
  paths[prop] = val
  const cached = require.cache[modulePath].exports
  if (cached[prop] !== val) {
    cached[prop] = val
  }
}

//
function overrideManifestPluginForEntry(chunkName, originalConfig) {
  const ManifestPlugin = resolveModule('webpack-manifest-plugin')
  for (const plug of originalConfig.plugins) {
    if (plug instanceof ManifestPlugin) {
      const { opts } = plug
      const { generate } = opts
      opts.generate = (seed, files, entrypoints) => {
        const replaced = entrypoints[chunkName]
        delete entrypoints[chunkName]
        entrypoints.main = replaced
        const res = generate(seed, files, entrypoints)
        delete entrypoints.main
        entrypoints[chunkName] = replaced
        return res
      }
    }
  }
}

function overrideHtmlWebpackPluginForPublicAssets(template, originalConfig) {
  const HtmlWebpackPlugin = resolveModule('html-webpack-plugin')
  for (const plug of originalConfig.plugins) {
    if (plug instanceof HtmlWebpackPlugin) {
      plug.options.template = template
    }
  }
}
