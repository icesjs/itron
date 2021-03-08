# itron

Electron 辅助构建打包工具，使用 webpack 进行代码构建，
[electron-builder](https://www.npmjs.com/package/electron-builder) 进行应用打包。

打包后的应用资源文件，不拷贝 node_modules 目录，所有依赖项通过 webpack 构建打包成 bundle。

支持 node 插件 (node addons) 的 webpack 打包，新老版本插件 (比如通过 bindings 加载的插件) 都可以。

内置国际化插件 (
[@ices/locale-webpack-plugin](https://www.npmjs.com/package/@ices/locale-webpack-plugin)
)，
使用 yml 配置国际化内容，提供 typescript 语言服务智能提示 (
[@ices/ts-plugin-locale](https://www.npmjs.com/package/@ices/ts-plugin-locale/)
)

内置动态主题插件 (
[@ices/theme-webpack-plugin](https://www.npmjs.com/package/@ices/theme-webpack-plugin)
)

使用 CreateReactApp 创建的项目，支持开箱即用。 未支持 VueCLI 构建的项目。

## 安装

```sh
yarn add -D itron

or

npm i -D itron
```

## 脚本命令

```json5
// package.json

{
  scripts: {
    start: 'itron start',
    build: 'itron build',
    pack: 'itron pack'
  }
}
```

## 配置项

```js
// <project-root>/itron.config.js

// 所有选项可选
// 下面列的是默认值
module.exports = {
  appBuildPath: 'build/',
  mainBuildPath: 'build/main',
  rendererBuildPath: 'build/renderer',
  addonsBuildPath: 'build/addons',
  rendererContextAlias: '@',
  rendererContext: 'src/renderer/',
  rendererEntry: 'src/renderer/index.tsx',
  rendererPublicAssets: 'public/web/',
  mainContextAlias: '#',
  mainContext: 'src/main/',
  mainEntry: 'src/main/index.ts',
  mainBuildFileName: 'index.js',
  cssModuleLocalIdentName: '[local]_[hash:base64:5]',
  themePlugin: {
    // themePlugin 值为 null 可禁用主题插件
    // 其他配置项与 @ices/theme-webpack-plugin 配置项相同
    extract: false,
    themes: ['src/renderer/themes/*.scss']
  },
  localePlugin: {
    // localePlugin 值为 null 可禁用本地化插件
    // 其他配置项与 @ices/locale-webpack-plugin 配置项相同
    extract: false
  },
  // 目前这两个预加载文件没进行转译处理，如果有需要，使用js语法
  mainPreloadFile: '',
  rendererPreloadFile: ''
}
```

## 环境变量

```dotenv
# .env
# .env.local
# .env.development
# .env.production

# 默认的环境变量配置（构建时会默认加载）
# 调试日志设置
#DEBUG=*
#DEBUG=viper:*
#DEBUG=viper:main
#DEBUG=viper:renderer
#DEBUG=viper:electron
#DEBUG=viper:script

# 定义渲染进程的构建目标环境(有效值：web或electron-renderer)
RENDERER_BUILD_TARGET=electron-renderer

# 是否自动打开浏览器
# 如果使用系统浏览器来开发调试，可以启用此项来自动打开浏览器
# 使用系统浏览器开发调试页面，仅在renderer构建目标为web时可用
# 可选值 none 、open
BROWSER=open

# 开发模式时自动启动electron应用
AUTO_LAUNCH_APP=true

# 代码变更时自动重启应用
AUTO_RELAUNCH_APP=true

# 重启延时(ms)(不低于2000)
AUTO_RELAUNCH_DELAY=5000

# 自动打开开发者工具
AUTO_OPEN_DEV_TOOLS=true

# 进行产品构建时生成映射文件
GENERATE_SOURCEMAP=false

# 是否在开发模式时生成完整的sourcemap
# 生成完整的sourcemap对构建效率有影响
GENERATE_FULL_SOURCEMAP=false

# 是否产品构建时使用调试模式
# 会生成sourcemap以及打开electron
ENABLE_PRODUCTION_DEBUG=false

# 产品模式，是否启用代码包分析
ENABLE_BUNDLE_ANALYZER=false

# 自定义HTTP开发服务器监听地址
# 默认本机地址
#HOST=localhost

# 自定义HTTP服务端口号
# 默认会从配置的端口起，选择可用的端口
# 默认起始端口号为3000
PORT=3000

# 控制台日志前缀名称的颜色选取（chalk颜色函数）
LOG_PREFIX_COLOR_MAIN=magenta
LOG_PREFIX_COLOR_RENDERER=blue
LOG_PREFIX_COLOR_ELECTRON=yellow
LOG_PREFIX_COLOR_SCRIPT=green

# 是否在禁用控制台颜色
NO_COLOR=false

# 控制台日志前缀格式，可用变量如下：
# {y} {m} {d} {h} {i} {s} {ms} {level} {name}
LOG_PREFIX_FORMAT="[ {name} ]"

# 启用electron模块的代理（仅在开发模式时有效）
# 启用代理后，会对一些模块功能进行拦截处理，以便更好的适用开发
# 比如初次启动应用时，打开应用窗口不会自动聚焦，就是通过代理拦截方法来实现的
USE_MODULE_PROXY_FOR_ELECTRON=true

# 开发模式下是否显示不自动聚焦的窗口
WINDOW_FIRST_SHOW_INACTIVE=true

# 设置应用开发日志的输出级别(产品模式下不会输出开发日志)
APP_DEV_LOG_LEVEL=info

# 设置应用产品日志的输出级别(仅在开发模式下生效)
APP_PRO_LOG_LEVEL=info

# 是否将调试日志写到日志文件中（在工程根目录下app.xxx.xxx）
WRITE_LOGS_TO_FILE=false

# 使用node插件，启用该项将会构建本地插件
ENABLE_NODE_ADDONS=true

# 开发模式下，是否启用上下文右键开发菜单
ENABLE_DEV_CONTEXT_MENU=true

# 浏览器扩展存储目录，开发模式下会默认安装此目录下的扩展
BROWSER_EXTENSIONS_DIR=extensions

# 构建本地插件时，用于下载electron构建相关源代码的镜像地址
ELECTRON_HEADERS_MIRROR_URL

# electron-builder的默认配置文件路径
ELECTRON_BUILDER_CONFIG=pack.yml

############ 应用内可使用的环境变量 ################
# 以 ELECTRON_APP_ 开头的仅在 main 代码中可用
# 以 REACT_APP_ 开头的仅在 renderer 代码中可用
# 以下变量由构建工具自动设置，请不要自行赋值
NODE_ENV
IS_ELECTRON
ELECTRON_APP_INDEX_HTML_URL
ELECTRON_APP_NODE_INTEGRATION
ELECTRON_APP_DEV_LOG_LEVEL
ELECTRON_APP_PRO_LOG_LEVEL
################################################
# 以下变量可自定义其值
#（来自@ices/react-locale定义）
#REACT_APP_DEFAULT_LOCALE=zh
#REACT_APP_FALLBACK_LOCALE=zh
REACT_APP_SUSPEND_LOCALE_WARNING=false
REACT_APP_LANG_QUERY_KEY=lang
```
