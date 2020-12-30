const path = require('path')
const fs = require('fs-extra')
const portfinder = require('portfinder')
const { log } = require('./logger')

module.exports = exports = {
  //
  relativePath(from, to, addDotPrefix = true) {
    let relativePath = path.relative(from, to).replace(/\\/g, '/')
    if (addDotPrefix && !/^..?\//.test(relativePath)) {
      relativePath = `./${relativePath}`
    }
    return relativePath
  },

  //
  printErrorAndExit(err) {
    log.error(err)
    process.nextTick(() => process.exit(process.exitCode || 1))
  },

  //
  getPackageJson() {
    return require(path.resolve('package.json'))
  },

  //
  emptyDirSync(dir) {
    if (!exports.isProtectedDirectory(dir)) {
      fs.emptyDirSync(path.resolve(dir))
    }
  },

  //
  async getAvailablePort(defaultPort) {
    defaultPort = +defaultPort || 5000
    return portfinder.getPortPromise({
      port: defaultPort,
      stopPort: defaultPort + 1000,
    })
  },

  //
  isProtectedDirectory(pathLike) {
    const absPath = path.resolve(pathLike)
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
    ]
    for (const dir of protectedDir) {
      if (path.resolve(dir) === absPath) {
        return true
      }
    }
  },
}
