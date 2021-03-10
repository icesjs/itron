const { CSS_MODULE_LOCAL_IDENT_NAME, babelPlugins = [], babelPresets = [] } = require('../index')

module.exports = {
  presets: [...babelPresets],
  plugins: [
    [
      'babel-plugin-react-css-modules',
      {
        generateScopedName: CSS_MODULE_LOCAL_IDENT_NAME,
        attributeNames: { activeStyleName: 'activeClassName' }
      }
    ],
    ...babelPlugins
  ]
}
