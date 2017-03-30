// @flow

import path from 'path'
import webpack from 'webpack'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import MeteorImportsPlugin from 'meteor-imports-webpack-plugin'
import cssModulesValues from 'postcss-modules-values'
import buildDir from '../buildDir'

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src')
const globalCSS = path.join(srcDir, 'styles', 'global')
const clientInclude = [srcDir]

const { ROOT_URL } = process.env

const meteorConfig = {
  meteorProgramsFolder: path.resolve(buildDir, 'meteor', 'bundle', 'programs'),
  injectMeteorRuntimeConfig: false,
  exclude: [],
}

const config = {
  context: root,
  devtool: 'eval',
  entry: [
    './src/client/index.js',
    'react-hot-loader/patch',
    'webpack-hot-middleware/client',
  ],
  output: {
    // https://github.com/webpack/webpack/issues/1752
    filename: 'app.js',
    chunkFilename: '[name]_[chunkhash].js',
    path: path.join(buildDir, 'static'),
    publicPath: '/static/',
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__PRODUCTION__': false,
      'Meteor.isClient': true,
      'Meteor.isCordova': false,
      'Meteor.isServer': false,
      'process.env.TARGET': JSON.stringify(process.env.TARGET),
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new HappyPack({
      loaders: [{
        path: 'babel-loader',
        options: {
          "presets": [["es2015", {loose: true, modules: false}], "stage-1", "react", "flow"],
          "plugins": [
            "transform-runtime",
            "react-hot-loader/babel",
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
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [cssModulesValues]
      }
    }),
    new MeteorImportsPlugin(meteorConfig),
  ],
  module: {
    rules: [
      {
        test: /\.json$/,
        loader: 'json-loader',
        exclude: [
          path.join(root, 'build', 'meteor', 'bundle', 'programs'),
        ]
      },
      {test: /\.txt$/, loader: 'raw-loader'},
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        use: [{loader: 'url-loader', options: {limit: 10000}}]
      },
      {test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader'},
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader'},
          {
            loader: 'css-loader',
            options: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]_[local]_[hash:base64:5]'
            }
          },
          {loader: 'postcss-loader'},
        ],
        exclude: globalCSS,
        include: clientInclude,
      },
      {
        test: /\.css$/,
        use: [{loader: 'style-loader'}, {loader: 'css-loader'}],
        include: globalCSS,
      },
      {
        test: /\.js$/,
        loader: 'happypack/loader',
        include: clientInclude,
      },
    ],
  },
  watch: true,
  devServer: {
    contentBase: ROOT_URL,
    publicPath: '/static/',
    noInfo: true,
    port: 4000,
    stats: {
      colors: true,
    },
  },
}

/* istanbul ignore next */
if (!process.env.CI) config.plugins.push(new ProgressBarPlugin())

export default config

