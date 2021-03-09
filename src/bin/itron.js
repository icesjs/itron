#!/usr/bin/env node

const { Command } = require('commander')
const program = new Command('itron')

// start
program
  .command('start', { isDefault: true })
  .alias('serve')
  .description('start development server')
  .option('-h, --host <host>', 'specify hostname')
  .option('-p, --port <port>', 'specify port')
  .option('-s, --https', 'use https protocol')
  .option('-o, --open', 'open browser on startup for web target')
  .option('-l, --launch', 'launch electron app on startup')
  .action((options) => require('../scripts/start')(options))

// build
program
  .command('build')
  .description('build for production')
  .action((options) => require('../scripts/build')(options))

// test
program
  .command('test')
  .description('run test')
  .action((options) => require('../scripts/test')(options))

// pack
program
  .command('pack')
  .description('create app installation package')
  .option('-a, --arch <value>', 'CPU architecture', process.arch)
  .option('-p, --platform <value>', 'operating system platform', process.platform)
  .option(
    '-c, --config <file>',
    'the path to an electron-builder config, see https://goo.gl/YFRJOM'
  )
  .option('-b, --publish <value>', 'publish artifacts, see https://goo.gl/tSFycD', null)
  .option('-d, --dir', 'build unpacked dir', false)
  .option('-r, --rebuild', 'force rebuild the node addons', false)
  .action((options) => require('../scripts/pack')(options))

//
program.parse(process.argv)
