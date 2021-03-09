const fs = require('fs')
const path = require('path')
const findUp = require('find-up')
const cwd = fs.realpathSync(process.cwd())

const reactScripts = resolveBuilder('react-scripts', 'react-scripts')
const vueCLIService = resolveBuilder('@vue/cli-service', 'vue-cli-service')
const viteService = resolveBuilder('vite', 'vite')

/**
 * 解析模块路径
 */
function resolveModulePath(name, throwError = true, extraPaths = []) {
  try {
    const paths = [cwd, ...extraPaths]
    const builderContext = reactScripts.context || vueCLIService.context || viteService.context
    if (builderContext) {
      paths.unshift(builderContext)
    }
    return require.resolve(name, { paths })
  } catch (e) {
    if (throwError) {
      throw e
    }
    return ''
  }
}

/**
 * 根据模块名解析并加载一个模块
 */
function resolveModule(name, throwError = true, extraPaths = []) {
  const modulePath = resolveModulePath(name, throwError, extraPaths)
  if (modulePath) {
    return require(modulePath)
  }
  return null
}

/**
 * 从指定目录路径开始，向上递归解析模块描述文件（package.json），直到指定的根目录为止。
 * @param context 解析起点
 * @param root 结束解析的根目录，一般为当前工程根目录
 * @param async 是否使用异步模式，异步模式返回Promise
 * @returns {Promise<string | undefined> | *}
 */
function resolvePackage(context, root = cwd, async = false) {
  root = path.normalize(root)
  return (async ? findUp : findUp.sync)(
    (dir) => (root === path.normalize(dir) ? findUp.stop : 'package.json'),
    {
      cwd: context
    }
  )
}

/**
 * 解析构建工具的路径。
 * @param moduleName 模块名称
 * @param binName bin名称
 * @return {{bin: string, context: string}}
 */
function resolveBuilder(moduleName, binName) {
  let builder
  try {
    const packagePath = require.resolve(`${moduleName}/package.json`, { paths: [cwd] })
    const { bin } = require(packagePath)
    const context = path.dirname(packagePath)
    builder = {
      context,
      bin: path.join(context, typeof bin === 'string' ? bin : bin[binName])
    }
  } catch (e) {
    builder = {
      context: '',
      bin: ''
    }
  }
  return builder
}

//
module.exports = {
  resolveModulePath,
  resolveModule,
  resolvePackage,
  reactScripts,
  vueCLIService,
  viteService
}
