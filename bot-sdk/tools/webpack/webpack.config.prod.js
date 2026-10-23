const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  mode: 'production',
  entry: ['./src/main.tsx'],
  module: {
    rules: require('./webpack.rules'),
  },
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'rhinon-chat.js',
    // All exports (default + initRhinonChat + the old initRhinontech/initSaleszium
    // names) for npm users. The UMD global gets its own name: main.tsx sets
    // window.RhinonChat to the function itself, which script-tag users call.
    library: {
      name: 'RhinonChatSDK',
      type: 'umd',
    },
    globalObject: 'this',
    clean: true,
  },
  plugins: [
    ...require('./webpack.plugins'),
    // Define environment variables at build time
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.REACT_APP_NEW_SERVER_API_URL': JSON.stringify(
        process.env.REACT_APP_NEW_SERVER_API_URL || '',
      ),
      'process.env.REACT_APP_SOCKET_URL': JSON.stringify(
        process.env.REACT_APP_SOCKET_URL || '',
      ),
      'process.env.REACT_APP_API_KEY': JSON.stringify(
        process.env.REACT_APP_API_KEY || '',
      ),
      'process.env.REACT_APP_VERSION': JSON.stringify(
        process.env.npm_package_version || '1.0.0',
      ),
      'process.env.REACT_APP_API_URL_AI': JSON.stringify(
        process.env.REACT_APP_API_URL_AI || '',
      ),
      // TURN credentials are minted per call by the backend (services/turnCredentials.ts) — never built in.
      // Add any other env vars you need here
    }),
    // Force a single bundle to prevent ChunkLoadError
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
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
  optimization: {
    minimize: true,
    sideEffects: true,
    concatenateModules: true,
    runtimeChunk: false,
    splitChunks: false,
  },
};
