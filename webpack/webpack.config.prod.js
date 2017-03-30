// @flow

import path from 'path'
import webpack from 'webpack'
import AssetsPlugin from 'assets-webpack-plugin'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import MeteorImportsPlugin from 'meteor-imports-webpack-plugin'
import cssModulesValues from 'postcss-modules-values'
import buildDir from '../buildDir'

const root = path.resolve(__dirname, '..')
const srcDir = path.resolve(root, 'src')
const globalCSS = path.join(srcDir, 'styles', 'global')
const clientInclude = [srcDir]

const meteorConfig = {
  meteorProgramsFolder: path.resolve(buildDir, 'meteor', 'bundle', 'programs'),
  injectMeteorRuntimeConfig: false,
  exclude: [],
}

const vendor = [
  'react',
  'react-dom',
]

const config = {
  context: root,
  devtool: 'source-map',
  entry: {
    app: './src/client/index.js',
    vendor,
    meteor: ['meteor-imports'],
  },
  output: {
    filename: '[name]_[chunkhash].js',
    chunkFilename: '[name]_[chunkhash].js',
    path: path.join(buildDir, 'static'),
    publicPath: '/static/',
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['vendor', 'manifest'],
      minChunks: Infinity,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'meteor',
      chunks: ['meteor']
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.optimize.MinChunkSizePlugin({minChunkSize: 50000}),
    new webpack.NoEmitOnErrorsPlugin(),
    new AssetsPlugin({path: buildDir, filename: 'assets.json'}),
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      'Meteor.isClient': true,
      'Meteor.isCordova': false,
      'Meteor.isServer': false,
      'process.env.TARGET': JSON.stringify(process.env.TARGET),
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.IgnorePlugin(/\/server\//),
    new HappyPack({
      cache: false,
      loaders: [{
        path: 'babel-loader',
        options: {
          "presets": [["es2015", {loose: true, modules: false}], "stage-1", "react", "flow"],
          "plugins": [
            "transform-runtime",
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
      minimize: true,
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
      {test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, use: [{loader: 'url-loader', options: {limit: 10000}}]},
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
          {loader: 'postcss-loader'}
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
}

/* istanbul ignore next */
if (!process.env.CI) config.plugins.push(new ProgressBarPlugin())
if (process.argv.indexOf('--no-uglify') < 0) {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compressor: { warnings: false }
  }))
}

export default config
