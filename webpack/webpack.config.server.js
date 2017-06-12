// @flow

import path from 'path'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import '../getenv'
import buildDir from '../buildDir'

const root = path.resolve(__dirname, '..')
const srcDir = path.resolve(root, 'src')
const globalCSS = path.join(srcDir, 'styles', 'global')

const config = {
  context: root,
  devtool: process.env.WEBPACK_DEVTOOL || 'source-map',
  entry: {
    prerender: './src/server',
  },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  output: {
    path: buildDir,
    chunkFilename: '[name]_[chunkhash].js',
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    publicPath: '/assets/',
  },
  // ignore anything that throws warnings & doesn't affect the view
  externals: [
    nodeExternals({
      modulesDir: path.join(root, 'node_modules'),
    }),
    (context: string, request: string, callback: (error?: ?Error, request?: string) => any): any => {
      // require anything in build/meteor/bundle/programs/server/* via node
      const match = /meteor\/bundle\/programs\/server\/.*$/.exec(request)
      if (match) {
        return callback(null, 'commonjs ./' + match[0])
      }
      callback()
    },
  ],
  plugins: [
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('/assets/[name].css'),
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    new webpack.DefinePlugin({
      '__CLIENT__': false,
      '__PRODUCTION__': true,
      'Meteor.isClient': false,
      'Meteor.isCordova': false,
      'Meteor.isServer': true,
      'process.env.TARGET': JSON.stringify(process.env.TARGET),
      'process.env.NODE_ENV': JSON.stringify('production'),
      // uncomment this line to hard-disable full SSR
      // 'process.env.DISABLE_FULL_SSR': JSON.stringify('1'),
    }),
    new HappyPack({
      id: '1', // https://github.com/amireh/happypack/issues/88
      cache: false,
      loaders: ['babel'],
      threads: 4,
    }),
  ],
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.txt$/, loader: 'raw-loader' },
      { test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, loader: 'url-loader?limit=10000' },
      { test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader' },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          'fake-style',
          'css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!postcss'
        ),
        include: srcDir,
        exclude: globalCSS,
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('fake-style', 'css'),
        include: globalCSS,
      },
      {
        test: /\.js$/,
        loader: 'happypack/loader',
        include: srcDir,
      },
    ],
  },
}

/* istanbul ignore next */
if (!process.env.CI) config.plugins.push(new ProgressBarPlugin())

export default config
