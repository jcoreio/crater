import path from 'path'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import cssModulesValues from 'postcss-modules-values'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import MeteorImportsPlugin from 'meteor-imports-webpack-plugin'

const {ROOT_URL} = process.env

const root = path.resolve(__dirname, '..')
const srcDir = path.resolve(root, 'src')
const globalCSS = path.join(root, 'src', 'styles', 'global')

export default {
  context: root,
  entry: {
    prerender: './src/routes/index.js'
  },
  target: 'node',
  output: {
    path: path.join(root, 'build'),
    chunkFilename: '[name]_[chunkhash].js',
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    publicPath: '/static/'
  },
  // ignore anything that throws warnings & doesn't affect the view
  externals: [
    'es6-promisify',
    (context, request, callback) => {
      // Every module prefixed with "global-" becomes external
      // "global-abc" -> abc
      const match = /^meteor\/(.*)$/.exec(request)
      if (match) {
        return callback(null, "var Package." + match[1].replace(/\//g, '.'))
      }
      callback()
    },
  ],
  postcss: [cssModulesValues],
  plugins: [
    new webpack.NoErrorsPlugin(),
    new ExtractTextPlugin('[name].css'),
    // new webpack.optimize.UglifyJsPlugin({compressor: {warnings: false}}),
    new webpack.optimize.LimitChunkCountPlugin({maxChunks: 1}),
    new webpack.DefinePlugin({
      '__CLIENT__': false,
      '__PRODUCTION__': true,
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new HappyPack({
      cache: false,
      loaders: ['babel'],
      threads: 4
    }),
    new ProgressBarPlugin(),
  ],
  module: {
    loaders: [
      {test: /\.json$/, loader: 'json-loader'},
      {test: /\.txt$/, loader: 'raw-loader'},
      {test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, loader: 'url-loader?limit=10000'},
      {test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader'},
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('fake-style', 'css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!postcss'),
        include: srcDir,
        exclude: globalCSS
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('fake-style', 'css'),
        include: globalCSS
      },
      {
        test: /\.js$/,
        loader: 'happypack/loader',
        include: srcDir
      }
    ]
  }
}
