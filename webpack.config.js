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
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
  plugins: [
    new webpack.IgnorePlugin(/vertx/), // https://github.com/stefanpenner/es6-promise/issues/100
    new WebpackMonitor({
      target: '../.monitor.json',
    }),
  ],
};
