const { createWebpackAliases } = require('./webpack.helpers');

/**
 * Export Webpack Aliases
 *
 * Tip: Some text editors will show the errors or invalid intellisense reports
 * based on these webpack aliases, make sure to update `tsconfig.json` file also
 * to match the `paths` we using in here for aliases in project.
 */
module.exports = createWebpackAliases({
  '@assets': 'assets',
  '@src': 'src',
  '@tools': 'tools',
  // New organized structure
  '@': 'src',
  '@/types': 'src/types',
  '@/constants': 'src/constants',
  '@/services': 'src/services',
  '@/store': 'src/store',
  '@/hooks': 'src/hooks',
  '@/components': 'src/components',
  '@/screens': 'src/screens',
  '@/styles': 'src/styles',
  '@/utils': 'src/utils',
});
