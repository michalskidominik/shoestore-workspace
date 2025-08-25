const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: process.env.NODE_ENV === 'production',
      outputHashing: 'none',
      generatePackageJson: true,
      // Production optimizations
      ...(process.env.NODE_ENV === 'production' && {
        sourceMap: false,
        extractLicenses: true,
        vendorChunk: false,
        buildLibsFromSource: false,
      }),
    }),
  ],
  // Additional production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    mode: 'production',
    optimization: {
      minimize: true,
      nodeEnv: 'production',
    },
  }),
};
