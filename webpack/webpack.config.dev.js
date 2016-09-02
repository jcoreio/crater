import path from 'path'
import webpack from 'webpack'
import HappyPack from 'happypack'
import ProgressBarPlugin from 'progress-bar-webpack-plugin'
import MeteorImportsPlugin from 'meteor-imports-webpack-plugin'

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src')
console.log(path.join(root, 'meteor'))

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
      ROOT_URL,
      DDP_DEFAULT_CONNECTION_URL: ROOT_URL,
      PUBLIC_SETTINGS: {},
      meteorFolder: 'meteor',
      meteorEnv: { NODE_ENV: 'development' },
      exclude: ['ecmascript']
    }),
  ],
  module: {
    loaders: [
      {test: /\.json$/, loader: 'json-loader', include: [srcDir, 'node_modules']},
      {test: /\.txt$/, loader: 'raw-loader'},
      {test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/, loader: 'url-loader?limit=10000'},
      {test: /\.(eot|ttf|wav|mp3)$/, loader: 'file-loader'},
      {
        test: /\.css$/,
        loader: 'style!css',
        include: [srcDir]
      },
      {
        test: /\.js$/,
        loader: 'happypack/loader',
        include: [srcDir]
      }
    ]
  },
  watch: true,
  devServer: {
    contentBase: ROOT_URL,
    publicPath: '/static/',
    noInfo: true,
    stats: {
      colors: true,
    }
  }
}
