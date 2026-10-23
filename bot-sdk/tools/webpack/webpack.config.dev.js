// tools/webpack/webpack.config.dev.js
const path = require('path');
const webpack = require('webpack');

// Load environment variables at build time (not bundled)
require('dotenv').config();

module.exports = {
  mode: 'development',
  entry: ['./src/main.tsx'],
  module: {
    rules: require('./webpack.rules'),
  },
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'rhinon-chat.js',
    library: {
      name: 'SalesziumBot',
      type: 'umd',
    },
    globalObject: 'this',
    clean: true,
  },
  plugins: [
    ...require('./webpack.plugins'),
    // Define environment variables at build time
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.REACT_APP_NEW_SERVER_API_URL': JSON.stringify(
        process.env.REACT_APP_NEW_SERVER_API_URL || 'http://localhost:5055/widget',
      ),
      'process.env.REACT_APP_SOCKET_URL': JSON.stringify(
        process.env.REACT_APP_SOCKET_URL || 'http://localhost:5055',
      ),
      'process.env.REACT_APP_API_KEY': JSON.stringify(
        process.env.REACT_APP_API_KEY || 'dev_key',
      ),
      'process.env.REACT_APP_VERSION': JSON.stringify(
        process.env.npm_package_version || '1.0.0',
      ),
      'process.env.REACT_APP_API_URL_AI': JSON.stringify(
        process.env.REACT_APP_API_URL_AI || 'http://localhost:5055/widget',
      ),
      // TURN credentials are minted per call by the backend (services/turnCredentials.ts) — never built in.
      // Add any other env vars you need here
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      ...require('./webpack.aliases'),
    },
    // Add fallbacks for Node.js modules
    fallback: {
      path: false,
      os: false,
      crypto: false,
      fs: false,
      util: false,
      stream: false,
      buffer: false,
    },
  },
  stats: 'errors-warnings',
  devtool: 'cheap-module-source-map',
  devServer: {
    static: [
      { directory: path.join(__dirname, '../../dist') },
      { directory: path.join(__dirname, '../../public') },
    ],
    open: true,
    hot: true,
    compress: true,
    port: 8081,
  },
  optimization: {
    minimize: false,
    sideEffects: true,
    concatenateModules: true,
    runtimeChunk: false,
    splitChunks: false,
  },
  performance: {
    hints: false,
  },
};
