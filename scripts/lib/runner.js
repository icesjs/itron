const chalk = require('chalk')
const { log } = require('./logger')
const { resolvePackage } = require('./resolve')
const respawn = require('./respawn')
const webpack = resolvePackage('webpack')

function runWebpack({ config, logger, env, watch, watchOptions, beforeWatchRun, afterWatchRun }) {
  Object.assign(process.env, env)
  const { stats: statsOptions, ...options } = require(config)
  const compiler = webpack(options)
  compiler.hooks.done.tapAsync('done', (stats, done) => {
    !stats.hasErrors() && logger.info(chalk.green('Compiled successfully!'))
    done()
  })

  //
  let watching
  const task = new Promise((resolve, reject) => {
    let isFirstRun = true
    const callback = (err, stats) => {
      if (err) {
        if (isFirstRun) {
          logger.error(err)
          return reject(err)
        } else {
          throw err
        }
      }
      logger.log(stats['toString'](statsOptions))
      if (!isFirstRun) {
        return typeof afterWatchRun === 'function' && afterWatchRun()
      }
      isFirstRun = false
      resolve()
    }
    //
    if (watch) {
      if (typeof beforeWatchRun === 'function') {
        compiler.hooks.watchRun.tapAsync('watch-run', async (compilation, done) => {
          !isFirstRun && (await beforeWatchRun(compilation))
          done()
        })
      }
      watching = compiler.watch(watchOptions || {}, callback)
    } else {
      compiler.run(callback)
    }
  })
  //
  task.stop = (callback = () => {}) => (watching ? watching.close(callback) : callback())
  return task
}

function runScript({
  script,
  args = [],
  logger = log,
  crashRestarts = 0,
  exitHandle = null,
  beforeExit = null,
  ...options
}) {
  if (!Array.isArray(runScript.runners)) {
    runScript.runners = []
  }
  const runners = runScript.runners
  const runner = respawn(script, args, options)
  runners.push(runner)

  if (typeof exitHandle !== 'function') {
    const clear = (code) => {
      let task
      while ((task = runners.pop())) {
        task !== runner && task.stop()
      }
      process.exitCode = code
      const exit = () => process.nextTick(() => process.exit())
      if (typeof beforeExit === 'function') {
        try {
          beforeExit(exit)
        } catch (e) {
          log.error(e)
          exit()
        }
      } else {
        exit()
      }
    }
    exitHandle = (code, signal) => {
      if (code === 0 || process.env.NODE_ENV !== 'development') {
        clear(code)
      } else {
        // code=15为开发菜单里定义的重启退出代码
        if (code !== 15) {
          log.error(`The process was crashed${signal ? ' with signal' + signal : ''}`)
          if (!crashRestarts--) {
            return clear(code)
          }
          log.info(`Starting the process again...`)
        }
        runner.restart()
      }
    }
  }

  return runner
    .on('start', ({ stdout, stderr }) => {
      stdout && stdout.on('data', logger.info)
      stderr && stderr.on('data', logger.error)
    })
    .on('exit', exitHandle)
}

module.exports = {
  runWebpack,
  runScript,
}
