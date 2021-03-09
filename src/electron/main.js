const { app, shell, BrowserWindow, dialog, Menu } = require('electron')

class Viper {
  constructor(options) {
    const boundHandleException = this.handleException.bind(this)
    process.on('uncaughtException', boundHandleException)
    process.on('unhandledRejection', boundHandleException)
    this.options = options || { single: true, nodeIntegration: false, indexURL: '' }
    this.isEnvProduction = app.isPackaged || process.env.NODE_ENV !== 'development'
    this.mainWindow = null
  }

  // 初始化主进程窗口
  main() {
    const { single } = this.options
    if (single && !this.checkInstanceLock()) {
      return app.quit()
    }

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    const boundCreateWindow = this.createWindow.bind(this)
    app.on('activate', boundCreateWindow)
    app.whenReady().then(boundCreateWindow)
  }

  // 创建窗口
  async createWindow() {
    if (this.mainWindow !== null) {
      return
    }
    const { options, isEnvProduction } = this
    const { nodeIntegration, indexURL } = options

    // 创建窗口实例
    const window = (this.mainWindow = new BrowserWindow({
      title: app.name,
      show: false,
      width: 1024,
      height: 728,
      backgroundColor: 'transparent', // 初始背景色需要根据系统主题颜色自动设置
      // titleBarStyle: isEnvProduction ? 'hidden' : 'default',
      // vibrancy: 'ultra-dark',
      webPreferences: {
        nodeIntegration,
        enableRemoteModule: nodeIntegration,
        contextIsolation: !nodeIntegration,
        devTools: !app.isPackaged,
        webSecurity: isEnvProduction,
        allowRunningInsecureContent: true,
        scrollBounce: true,
        defaultEncoding: 'utf8',
        spellcheck: false,
        enableWebSQL: false
      }
    }))

    window.once('ready-to-show', () => this.mainWindow?.show())
    window.once('closed', () => (this.mainWindow = null))

    if (indexURL) {
      await window.loadURL(indexURL)
    }

    Menu.setApplicationMenu(null)

    window.webContents.on('new-window', (event, url) => {
      event.preventDefault()
      shell.openExternal(url)
    })
  }

  async handleException(err) {
    const { isEnvProduction } = this
    const errMessage = isEnvProduction ? '' : err.message
    await dialog.showErrorBox('Error', errMessage)
    if (isEnvProduction) {
      process.nextTick(() => process.exit(1))
    }
  }

  // 检查单实例锁
  checkInstanceLock() {
    if (app.requestSingleInstanceLock()) {
      app.on('second-instance', () => {
        // 运行第二个实例时
        const window = this.mainWindow
        if (window) {
          if (window.isMinimized()) {
            window.restore()
          }
          window.focus()
        }
      })
      return true
    }
    return false
  }
}

// 启动应用
new Viper({
  single: true,
  indexURL: process.env.ELECTRON_APP_INDEX_HTML_URL,
  nodeIntegration: !!process.env.ELECTRON_APP_NODE_INTEGRATION
}).main()
