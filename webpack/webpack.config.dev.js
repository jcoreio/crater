// @flow

import path from 'path'
import webpack from 'webpack'
// import HappyPack from 'happypack'
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
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__PRODUCTION__': false,
      'Meteor.isClient': true,
      'Meteor.isCordova': false,
      'Meteor.isServer': false,
      'process.env.TARGET': JSON.stringify(process.env.TARGET),
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    // disable HappyPack until it becomes compatible with webpack2 https://github.com/amireh/happypack/issues/91
    // new HappyPack({
    //   id: '1', // https://github.com/amireh/happypack/issues/88
    //   loaders: ['babel'],
    //   threads: 4,
    // }),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [cssModulesValues]
      }
    }),
    new MeteorImportsPlugin(meteorConfig),
  ],
  module: {
    rules: [
      { test: /\.json$/,
        use: [{loader: 'json-loader'}],
        exclude: [
          path.join(root, 'node_modules', 'meteor-imports-webpack-plugin'),
          path.join(root, 'build', 'meteor', 'bundle', 'programs'),
      ]},
      { test: /\.txt$/, use:[{loader: 'raw-loader'}] },
      { test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
        use:[{loader: 'url-loader', query: {limit: 10000}}]
      },
      { test: /\.(eot|ttf|wav|mp3)$/, use:[{loader: 'file-loader'}] },
      { test: /\.css$/,
        use:[
          { loader: 'style'},
          { loader: 'css',
            query: {
              modules: true,
              importLoaders: 1,
              localIdentName: '[name]_[local]_[hash:base64:5]'
            }
          },
          { loader: 'postcss'}
        ],
        exclude: globalCSS,
        include: clientInclude,
      },
      { test: /\.css$/,
        use:[{loader: 'style'}, {loader: 'css'}],
        include: globalCSS,
      },
      { test: /\.js$/,
        use:[{
          loader: 'babel',
          options: {
            'plugins': [
              'react-hot-loader/babel',
            ],
          },
        }],
        include: clientInclude,
      },
      //This is a workaround, the meteor-config is supposed to be injected in meteor-imports-webpack-plugin
      //but this does not work in webpack2.1.beta23+ so it is loaded here until a solution can be found
      { test: /meteor-config\.json$/,
        include: [path.join(root, 'node_modules', 'meteor-imports-webpack-plugin')],
        use: [{
          loader: 'json-string-loader',
          query: 'json=' + JSON.stringify(meteorConfig)
        }]
      }
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

if (!process.env.CI) config.plugins.push(new ProgressBarPlugin())

export default config

