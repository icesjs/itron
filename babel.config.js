module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: 'node 8.12.0',
        modules: 'cjs',
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: false
        },
        shippedProposals: false
      }
    ]
  ],
  plugins: [
    [
      '@babel/plugin-transform-runtime',
      {
        helpers: true,
        corejs: false,
        regenerator: false,
        version: require('@babel/runtime/package.json').version
      }
    ]
  ]
}
