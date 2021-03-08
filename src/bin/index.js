#!/usr/bin/env node

const args = process.argv.slice(2)
const scriptIndex = args.findIndex((x) => x === 'start' || x === 'build' || x === 'pack')
const script = scriptIndex === -1 ? args[0] : args[scriptIndex]

switch (script) {
  case 'build':
    require('./build')
    break
  case 'pack':
    require('./pack')
    break
  case 'start':
  default:
    require('./start')
    break
}
