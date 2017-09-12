// @flow

import path from 'path'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import nodeExternals from 'webpack-node-externals'
import requireEnv from '../requireEnv'

const BUILD_DIR = requireEnv('BUILD_DIR')
const {WEBPACK_DEVTOOL, CI} = process.env

const root = path.resolve(__dirname, '..')
const srcDir = path.resolve(root, 'src')
const globalCSS = path.join(srcDir, 'styles', 'global')

const config = {
  context: root,
  entry: {
    prerender: './src/server',
  },
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  output: {
    path: BUILD_DIR,
    chunkFilename: '[name]_[chunkhash].js',
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    publicPath: '/static/',
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
    new webpack.NoEmitOnErrorsPlugin(),
    new ExtractTextPlugin('/static/[name].css'),
    new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
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
      cache: false,
      loaders: [{
        path: 'babel-loader',
        options: {
          "presets": [["es2015", {loose: true, modules: false}], "stage-1", "react", "flow"],
          "plugins": [
            "transform-runtime",
            "meteor-imports"
          ],
          "env": {
            "coverage": {
              "plugins": [
                "istanbul"
              ]
            }
          }
        }
      }],
      threads: 4,
    }),
  ],
  module: {
    loaders: [
      {test: /\.json$/, loader: 'json-loader'},
      {test: /\.txt$/, loader: 'raw-loader'},
      {test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, use: [{loader: 'url-loader', options: {limit: 10000}}]},
      {test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader'},
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 1,
                localIdentName: '[name]_[local]_[hash:base64:5]',
              }
            },
            {loader: 'postcss-loader'},
          ]
        }),
        include: srcDir,
        exclude: globalCSS,
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        }),
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
if (WEBPACK_DEVTOOL) (config: Object).devtool = WEBPACK_DEVTOOL
if (!CI) config.plugins.push(new ProgressBarPlugin())

export default config
