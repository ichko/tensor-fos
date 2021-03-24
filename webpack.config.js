const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/dist',
    filename: '[name].bundle.js',
  },
  watchOptions: {
    ignored: '**/node_modules',
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    compress: true,
    port: 8080,

  },
  plugins: [new HtmlWebpackPlugin({
    title: 'Development',
  })],
};
