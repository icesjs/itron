# itron

[Electron](https://www.npmjs.com/package/electron)
辅助构建打包工具，使用
[webpack](https://www.npmjs.com/package/webpack)
进行代码构建，
[electron-builder](https://www.npmjs.com/package/electron-builder)
进行应用打包。

打包后的应用资源文件，不拷贝 `node_modules` 目录，所有依赖项通过 webpack 构建打包成 bundle。

支持 node 插件 (node addons) 的 webpack 打包。支持通过
[bindings](https://www.npmjs.com/package/bindings)
加载的插件。

内置国际化插件 (
[@ices/locale-webpack-plugin](https://www.npmjs.com/package/@ices/locale-webpack-plugin)
)，
使用 yml 配置国际化内容。需要先安装
[@ices/react-locale](https://www.npmjs.com/package/@ices/react-locale)
依赖。暂只支持 react 版本。 提供 typescript 语言服务智能提示 (
[@ices/ts-plugin-locale](https://www.npmjs.com/package/@ices/ts-plugin-locale/)
)。

内置动态主题插件 (
[@ices/theme-webpack-plugin](https://www.npmjs.com/package/@ices/theme-webpack-plugin)
)。需要先安装
[@ices/theme](https://www.npmjs.com/package/@ices/theme)
依赖，或者在插件配置里指定 `themeExportPath` 配置项。

使用 [create-react-app](https://www.npmjs.com/package/create-react-app)
创建的项目，支持开箱即用。

计划适配支持 vue 构建工具相关的项目，也许吧。

这个构建工具是从
[viper](https://github.com/icesjs/viper)
项目里分离出来的，也许能够帮助到有需要的人吧。
这个 `viper` 项目打算实现一个网络视频资源播放应用，构建工具的问题修复以及新功能的添加，都会依据该项目的实践程度来执行。

## 安装

先安装开发依赖 `itron` 和 `electron`。

```sh
yarn add -D itron electron

or

npm i -D itron electron
```

## 脚本命令

更改 `package.json` 里面的 `scripts`，使用 `itron` 运行构建命令。

```json5
// package.json

{
  scripts: {
    start: 'itron start',
    build: 'itron build',
    pack: 'itron pack',
    test: 'itron test'
  }
}
```

## 配置项

对于使用
[create-react-app](https://www.npmjs.com/package/create-react-app)
创建的项目 (底层使用
[react-scripts](https://www.npmjs.com/package/react-scripts)
进行构建)，使用
[@craco/craco](https://www.npmjs.com/package/@craco/craco)
进行构建封装，所以能够修改一些由 `react-scripts` 内置的配置项。

如果只需要定义一些路径参数，也可以在 `package.json` 里面的 `itron` 字段里面配置。

如果使用配置文件 `itron.config.js` 则可以定义一些插件函数什么的，看使用者需求喜好了。

默认情况下，如果 `src/main` (扩展名可以为 `.js`、`.ts`、`.mjs`、`.cjs`) 文件不存在，则使用内置的主进程入口脚本。
通过配置项可以自己指定主进程入口文件。

`electron-builder` 打包配置可以使用环境变量 `ELECTRON_BUILDER_CONFIG` (配置文件路径) 指定，
也可以通过 `package.json` 里面的 `build` (配置对象) 字段配置。
如果找不到相关配置项，则使用内置的打包配置文件。建议自定配置文件，配置内容可以参考
[electron-builder](https://www.electron.build/)
的文档说明。

注意，自定打包配置文件里面的 `directories`、`files`、`extraMetadata.main`、`electronVersion`、`publish`
等字段的值，构建工具会根据实际情况写入，不需要手动指定。
因为这些配置项手动配置很容易搞错或遗漏路径导致构建失败。

### itron.config.js

```js
// <project-root>/itron.config.js

// 这些选项可以根据需要自行设置
module.exports = {
  // 应用构建输出路径
  appBuildPath: 'build/',

  // 主进程代码构建输出路径，需要在应用构建输出路径下
  mainBuildPath: 'build/main',

  // 渲染进程(web资源)构建输出路径，需要在应用构建输出路径下
  rendererBuildPath: 'build/renderer',

  // node插件构建输出路径，需要在应用构建输出路径下
  addonsBuildPath: 'build/addons',

  // 渲染进程(web资源)的代码目录
  rendererContext: 'src/renderer/',

  // 渲染进程的打包入口
  // 这个配置项可以修改构建工具 (如 react-scripts) 默认的打包入口
  rendererEntry: 'src/renderer/index.tsx',

  // 渲染进程的公共资源目录
  // 这个配置项可以修改构建工具 (如 react-scripts) 默认的公共资源目录
  rendererPublicAssets: 'public/web/',

  // 主进程代码目录
  mainContext: 'src/main/',

  // 主进程代码打包入口文件
  mainEntry: 'src/main/index.ts',

  // 主进程代码构建输出文件名称
  mainBuildFileName: 'index.js',

  // 下面的一些配置项，用于扩展构建能力

  // 动态主题插件
  themePlugin: {
    // themePlugin 值为 null 可禁用主题插件
    // 其他配置项与 @ices/theme-webpack-plugin 配置项相同
    extract: false,
    themes: ['src/renderer/themes/*.scss']
  },

  // 国际化插件
  localePlugin: {
    // localePlugin 值为 null 可禁用本地化插件
    // 其他配置项与 @ices/locale-webpack-plugin 配置项相同
    extract: false
  },

  // 额外的babel插件
  babelPlugins: [],

  // 额外的babel编译预设
  babelPresets: [],

  // 主进程构建配置，会与内置的配置进行合并
  mainWebpackConfig: {},

  // 渲染进程构建配置，会与内置的配置进行合并
  rendererWebpackConfig: {}
}
```

## 环境变量

环境变量可以通过配置文件指定，如果是基于 `react-scripts` 的项目，由其定义的环境变量也是可以使用的。

```dotenv
# .env
# .env.local
# .env.development
# .env.production

# 默认的环境变量配置（构建时会默认加载）
# 调试日志设置，[name] 中的 name 表示工程 package.json 里面的 name 字段值
# 通过这个配置项，可以过滤日志输出
#DEBUG=*
#DEBUG=[name]:*
#DEBUG=[name]:main
#DEBUG=[name]:renderer
#DEBUG=[name]:electron
#DEBUG=[name]:script

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
# 如果自动重启比较烦，可以禁用自动重启，通过上下文开发菜单里的重启菜单项手动重启
AUTO_RELAUNCH_APP=true

# 自动重启延时(ms)(不低于2000)
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
# 使用 webpack-bundle-analyzer 进行分析
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
# 禁用此选项，WINDOW_FIRST_SHOW_INACTIVE 将失效
USE_MODULE_PROXY_FOR_ELECTRON=true

# 开发模式下是否显示不自动聚焦的窗口
# 在自动重启模式下，主进程代码变更后，触发自动重启，如果自动聚焦到应用窗口，会干扰写代码的体验
# 仅在开发模式下生效，产品打包下，不会注入相关代码来变更原有的electron窗口显示逻辑
WINDOW_FIRST_SHOW_INACTIVE=true

# 设置应用开发日志的输出级别(产品模式下不会输出开发日志)(待废弃的)
# 需要主进程代码实现相关日志接口，现在构建工具作为单独npm包抽离出来了，这个设置考虑废弃掉
#APP_DEV_LOG_LEVEL=info

# 设置应用产品日志的输出级别(仅在开发模式下生效)(待废弃的)
#APP_PRO_LOG_LEVEL=info

# 是否将调试日志写到日志文件中（在工程根目录下app.xxx.xxx）
# 调试分析代码问题时，可以把日志输出到文件中保存起来，帮助分析解决问题
WRITE_LOGS_TO_FILE=false

# 使用node插件，启用该项将会构建本地插件(node addons)
# node插件也会通过webpack进行打包处理
# 因为插件的平台兼容性，启用插件后，打包时会扫描插件依赖并进行插件rebuild，会对打包效率造成一定影响
ENABLE_NODE_ADDONS=false

# 构建node插件(addons)时，用于下载electron构建相关源代码的镜像地址
# 不启用镜像地址，下载这些资源在国内会很费时，有时候甚至下载不下来
# 可惜的是，淘宝提供的electron相关资源镜像，也很久不更新了的样子
# 默认访问官方的镜像地址，大部分时候还是能下载的，只是慢一些
ELECTRON_HEADERS_MIRROR_URL

# 启用node全局路径变量检查(__filename、__dirname)
# 建议不要在renderer代码里面使用node的路径变量，以后还能发布到web平台
ENABLE_CHECK_NODE_PATHS=true

# 开发模式下，是否启用上下文开发菜单
# 开发菜单有一些功能，比如重启，刷新，打开开发者工具等
ENABLE_DEV_CONTEXT_MENU=true

# 浏览器扩展存储目录，开发模式下会默认安装此目录下的扩展
# 因为国内网络环境的关系，访问谷歌扩展市场大概率是不通的，所以扩展的安装改成从目录安装了
# 需要用到哪些扩展(比如React Developer Tools、Vue.js devtools)，可以自己到网上下载对应的扩展(.crx)，放到这个目录下就可以了
# 构建工具会自动安装这些扩展到electron web容器里
BROWSER_EXTENSIONS_DIR=extensions

# electron-builder 的默认配置文件路径，package.json里面的build字段备选
# 如果不存在任何用户自定配置，则使用内置的默认配置
ELECTRON_BUILDER_CONFIG=pack.yml

############ 应用内可使用的环境变量 ################
# 以 ELECTRON_APP_ 开头的仅在 main 代码中可用
# 以 REACT_APP_ 开头的仅在 renderer 代码中可用
# 以下变量由构建工具自动设置，请不要自行赋值
NODE_ENV
IS_ELECTRON
ELECTRON_APP_INDEX_HTML_URL
ELECTRON_APP_NODE_INTEGRATION
# 下面这两个没啥用了(待废弃)
#ELECTRON_APP_DEV_LOG_LEVEL
#ELECTRON_APP_PRO_LOG_LEVEL
################################################
# 以下变量可自定义其值
# 来自国际化插件(@ices/react-locale)的环境变量定义
#REACT_APP_DEFAULT_LOCALE=zh
#REACT_APP_FALLBACK_LOCALE=zh
#REACT_APP_SUSPEND_LOCALE_WARNING=false
#REACT_APP_LANG_QUERY_KEY=lang
```
