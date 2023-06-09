// webpack.config.js
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/utils.js',
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  output: {
    filename: 'utils.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
