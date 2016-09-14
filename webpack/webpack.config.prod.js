// @flow

import path from 'path'
import webpack from 'webpack'
import AssetsPlugin from 'assets-webpack-plugin'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import MeteorImportsPlugin from 'meteor-imports-webpack-plugin'
import cssModulesValues from 'postcss-modules-values'

const root = path.resolve(__dirname, '..')
const srcDir = path.resolve(root, 'src')
const globalCSS = path.join(srcDir, 'styles', 'global')
const clientInclude = [srcDir]

const vendor = [
  'react',
  'react-dom',
]

const config = {
  context: root,
  entry: {
    app: './src/client/index.js',
    vendor,
    meteor: ['meteor-imports'],
  },
  output: {
    filename: '[name]_[chunkhash].js',
    chunkFilename: '[name]_[chunkhash].js',
    path: path.join(root, 'build', 'static'),
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
    new webpack.optimize.MinChunkSizePlugin({ minChunkSize: 50000 }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: { warnings: false },
      // don't minify the meteor commons chunk
      exclude: /meteor.*\.js$/,
    }),
    new webpack.NoErrorsPlugin(),
    new AssetsPlugin({ path: path.join(root, 'build'), filename: 'assets.json' }),
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      'Meteor.isClient': true,
      'Meteor.isCordova': false,
      'Meteor.isServer': false,
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.IgnorePlugin(/\/server\//),
    new HappyPack({
      cache: false,
      loaders: ['babel'],
      threads: 4,
    }),
    new MeteorImportsPlugin({
      meteorProgramsFolder: path.resolve(__dirname, '..', 'build', 'meteor', 'bundle', 'programs'),
      exclude: ['ecmascript'],
      injectMeteorRuntimeConfig: false,
    }),
  ],
  postcss: [cssModulesValues],
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader', include: [...clientInclude, 'node_modules'] },
      { test: /\.txt$/, loader: 'raw-loader' },
      { test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, loader: 'url-loader?limit=10000' },
      { test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader' },
      {
        test: /\.css$/,
        loader: 'style!css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!postcss',
        exclude: globalCSS,
        include: clientInclude,
      },
      {
        test: /\.css$/,
        loader: 'style!css',
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

if (!process.env.CI) config.plugins.push(new ProgressBarPlugin())

export default config
