const { inDev } = require('./webpack.helpers');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = [
  // TypeScript loader
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },

  // Global CSS (used in dev or extract in prod)
  {
    test: /\.css$/,
    use: [
      inDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
      'css-loader',
    ],
  },

  // Global SCSS (for global files, NOT shadow DOM components)
  {
    test: /\.global\.s[ac]ss$/i, // Convention: *.global.scss
    use: [
      inDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
      'css-loader',
      'sass-loader',
    ],
  },

  // SCSS inside components (for Shadow DOM)
  {
    test: /\.s[ac]ss$/i,
    exclude: /\.global\.s[ac]ss$/i, // exclude global ones
    use: [
      'to-string-loader',
      'css-loader',
      'sass-loader',
    ],
  },

  // Less loader
  {
    test: /\.less$/,
    use: [
      inDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
      'css-loader',
      'less-loader',
    ],
  },

  // Asset loader
  {
    test: /\.(gif|jpe?g|tiff|png|webp|bmp|svg|eot|ttf|woff|woff2)$/i,
    type: 'asset',
    generator: {
      filename: 'assets/[hash][ext][query]',
    },
  },

  {
  test: /\.(png|jpe?g|gif|svg)$/i,
  type: 'asset/resource',
}

];
