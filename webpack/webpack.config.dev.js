import path from 'path'
import webpack from 'webpack'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import MeteorImportsPlugin from 'meteor-imports-webpack-plugin'
import cssModulesValues from 'postcss-modules-values'

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src')
const globalCSS = path.join(srcDir, 'styles', 'global')
const clientInclude = [srcDir]

const {ROOT_URL} = process.env

export default {
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
    path: path.join(root, 'build', 'static'),
    publicPath: '/static/'
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      '__CLIENT__': true,
      '__PRODUCTION__': false,
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new webpack.IgnorePlugin(/\/server\//),
    new HappyPack({
      loaders: ['babel'],
      threads: 4
    }),
    new ProgressBarPlugin(),
    new MeteorImportsPlugin({
      meteorFolder: 'meteor',
      exclude: ['ecmascript']
    }),
  ],
  postcss: [cssModulesValues],
  module: {
    loaders: [
      {test: /\.json$/, loader: 'json-loader', include: [...clientInclude, 'node_modules']},
      {test: /\.txt$/, loader: 'raw-loader'},
      {test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, loader: 'url-loader?limit=10000'},
      {test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader'},
      {
        test: /\.css$/,
        loader: 'style!css?modules&importLoaders=1&localIdentName=[name]_[local]_[hash:base64:5]!postcss',
        exclude: globalCSS,
        include: clientInclude
      },
      {
        test: /\.css$/,
        loader: 'style!css',
        include: globalCSS,
      },
      {
        test: /\.js$/,
        loader: 'happypack/loader',
        include: clientInclude
      }
    ]
  },
  watch: true,
  devServer: {
    contentBase: ROOT_URL,
    publicPath: '/static/',
    noInfo: true,
    port: 4000,
    stats: {
      colors: true,
    }
  }
}
