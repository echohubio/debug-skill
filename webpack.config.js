const webpack = require('webpack');
const slsw = require('serverless-webpack');
const WebpackMonitor = require('webpack-monitor');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  externals: [
    /^aws-sdk/,
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: 'eslint-loader',
        exclude: /node_modules/,
      },
      {
        test: /keyv\/src\/index.js$/, // keyv has a wierd require that webpack doesn't like
        loader: 'string-replace-loader',
        query: {
          search: 'adapters[adapter]',
          replace: '\'events\'',
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/^electron|keyv$/), // Surpress warnings: got has electron in a require and we don't use keyv
    new WebpackMonitor({
      target: '../.monitor.json',
    }),
  ],
};
