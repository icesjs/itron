const path = require('path')
const fs = require('fs-extra')
const portfinder = require('portfinder')
const merge = require('deepmerge')
const JSON5 = require('json5')
const spawn = require('cross-spawn')
const { resolveModulePath } = require('./resolve')

module.exports = exports = {
  //
  relativePath(from, to, addDotPrefix = true) {
    let relativePath = !to ? '' : path.relative(from, to).replace(/\\/g, '/')
    if (addDotPrefix && relativePath && !/^\.\.?\//.test(relativePath)) {
      relativePath = `./${relativePath}`
    }
    return relativePath || '.'
  },

  //
  updateJsonFile(filepath, obj, throwError = true) {
    try {
      const file = path.resolve(filepath)
      const raw = JSON5.parse(fs.readFileSync(file, 'utf8'))
      const content = JSON.stringify(merge(raw, obj, { arrayMerge: (dest, src) => src }))
      fs.writeFileSync(file, content)
      try {
        const cwd = process.cwd()
        spawn.sync('prettier', ['--write', path.relative(cwd, file)], {
          env: process.env,
          cwd
        })
      } catch (e) {}
    } catch (e) {
      if (throwError) {
        throw e
      } else {
        require('./logger').log.error(e)
      }
    }
  },

  //
  printErrorAndExit(err) {
    require('./logger').log.error(err)
    process.nextTick(() => process.exit(process.exitCode || 1))
  },

  //
  getPackageJson() {
    return require(path.resolve('package.json'))
  },

  //
  emptyDirSync(dir) {
    if (dir && typeof dir === 'string' && !exports.isProtectedDirectory(dir)) {
      fs.emptyDirSync(path.resolve(dir))
    }
  },

  //
  async getAvailablePort(defaultPort) {
    defaultPort = +defaultPort || 5000
    return portfinder.getPortPromise({
      port: defaultPort,
      stopPort: defaultPort + 1000
    })
  },

  //
  isProtectedDirectory(pathLike) {
    const absPath = path.resolve(pathLike)
    if (absPath === process.cwd()) {
      return true
    }
    const protectedDir = [
      'config',
      'assets',
      'node_modules',
      'public',
      'resources',
      'scripts',
      'src',
      'test',
      'tests',
      '__tests__',
      '.idea',
      '.vscode'
    ]
    for (const dir of protectedDir) {
      if (path.resolve(dir) === absPath) {
        return true
      }
    }
  },

  //
  formatDate(format, date = new Date()) {
    const now = {
      ms: date.getMilliseconds(),
      y: date.getFullYear(),
      m: date.getMonth() + 1,
      d: date.getDate(),
      h: date.getHours(),
      i: date.getMinutes(),
      s: date.getSeconds()
    }
    return `${format}`.replace(/ms|y{1,4}|m{1,2}|d{1,2}|h{1,2}|i{1,2}|s{1,2}/g, (m) =>
      `${now[[...new Set(m.split(''))].join('')]}`.padStart(m === 'ms' ? 4 : 2, '0')
    )
  },

  //
  async getCommitHEAD() {
    return await new Promise((resolve, reject) => {
      const cp = spawn('git', ['rev-parse', 'HEAD'], {
        silent: true,
        windowsHide: true
      })
      let content = ''
      cp.stdout.on('data', (buf) => {
        content += buf.toString()
      })
      cp.once('exit', (code) => (code === 0 ? resolve(content.trim()) : reject(code)))
    })
  },

  //
  deepProxy(object, propPaths, handler = {}) {
    if (typeof propPaths === 'string') {
      propPaths = propPaths.split('.')
    }
    if (!Array.isArray(propPaths) || !propPaths.length) {
      return object
    }
    return new Proxy(object, {
      get(target, property) {
        const value = target[property]
        if (property !== propPaths[0]) {
          return value
        }
        if (propPaths.length > 1) {
          // ????????????????????????
          return exports.deepProxy(value, propPaths.slice(1), handler)
        }
        // ??????????????????
        return new Proxy(value, handler)
      }
    })
  },

  // ?????????????????????????????????????????????typescript??????
  isTypeScriptProject() {
    const cwd = process.cwd()
    try {
      for (const file of fs.readdirSync(cwd).reverse()) {
        if (/tsconfig(\..+?)*\.json$/i.test(file)) {
          const { dependencies = {}, devDependencies = {} } = require(path.join(
            cwd,
            'package.json'
          ))
          if (dependencies.typescript || devDependencies.typescript) {
            return !!require.resolve('typescript', { paths: [cwd] })
          }
          break
        }
      }
    } catch (e) {}
    return false
  },

  // ??????????????????????????????
  getSelfContext() {
    const cwd = process.cwd()
    let file = __filename
    while (!fs.existsSync(path.join((file = path.dirname(file)), 'package.json'))) {
      if (file === cwd || path.basename(file) === 'node_modules') {
        file = ''
        break
      }
    }
    if (file && path.dirname(file) !== file) {
      return file
    }
    return ''
  },

  /**
   * ??????????????????
   * @param options ???????????????????????????????????????????????????????????????????????????????????????
   * @param module ???????????????????????????????????????????????????????????????
   * @return {null|*}
   */
  getOptionalPlugin(options, module) {
    if (!options) {
      return null
    }
    if (typeof options !== 'object') {
      options = {}
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
        moduleName = typeof module === 'string' ? path.join(__dirname, 'plugins', module) : ''
        dependency = ''
    }
    if (dependency && !resolveModulePath(dependency, false)) {
      // ?????????????????????????????????????????????
      return null
    }
    const Plugin = moduleName ? require(moduleName) : module()
    if (typeof Plugin === 'function') {
      return new Plugin(options)
    }
    return null
  }
}
