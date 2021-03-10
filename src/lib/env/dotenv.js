const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const cwd = process.cwd()

function parseFile(filename) {
  let content
  if (!filename) {
    content = fs.readFileSync(path.join(__dirname, '.env.default')).toString('utf-8')
  } else {
    const file = path.resolve(cwd, filename)
    if (fs.existsSync(file)) {
      content = fs.readFileSync(file).toString('utf-8')
    }
  }
  if (content) {
    return dotenv.parse(content)
  }
  return {}
}

module.exports = exports = function(...args) {
  return dotenv(...args)
}

exports.parse = dotenv.parse

exports.parseEnv = function parseEnv(env) {
  return {
    ...parseFile(), // inner default
    ...parseFile('.env'),
    ...parseFile('.env.local'),
    ...parseFile(`.env.${env}`)
  }
}
