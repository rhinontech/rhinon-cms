// tools/webpack/webpack.config.prod.js
const path = require('path');
const webpack = require('webpack');

// No dotenv here on purpose: a release must not pick up a developer's .env
// URLs. The widget finds its backend from its own script address (see
// src/services/api/client.ts). Set REACT_APP_* only to override that.

module.exports = {
  mode: 'production',
  entry: ['./src/main.tsx'],
  module: {
    rules: require('./webpack.rules'),
  },
  output: {
    path: path.resolve(__dirname, '../../dist'),
    filename: 'rhinonbot.js',
    library: {
      name: 'RhinonBot',
      type: 'umd',
      export: 'default',
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
      'process.env.REACT_APP_STUN_URLS': JSON.stringify(
        process.env.REACT_APP_STUN_URLS || '',
      ),
      'process.env.REACT_APP_TURN_URLS': JSON.stringify(
        process.env.REACT_APP_TURN_URLS || '',
      ),
      'process.env.REACT_APP_TURN_USERNAME': JSON.stringify(
        process.env.REACT_APP_TURN_USERNAME || '',
      ),
      'process.env.REACT_APP_TURN_CREDENTIAL': JSON.stringify(
        process.env.REACT_APP_TURN_CREDENTIAL || '',
      ),
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
