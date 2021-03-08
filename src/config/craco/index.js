//
const CracoPlugin = require('../../lib/plugins/CracoPlugin')

module.exports = {
  webpack: require('./webpack'),
  babel: require('./babel'),
  style: require('./style'),
  plugins: [{ plugin: CracoPlugin }]
}
