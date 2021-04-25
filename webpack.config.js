const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    index: './src/index.ts',
  },
  devtool: 'inline-source-map',
  module: {
    rules: [{
        test: /\.worker\.ts$/,
        use: {
          loader: "worker-loader"
        },
      }, {
        test: /\.(tsx?|jsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    modules: [path.resolve('.'), path.resolve('./node_modules')],
    extensions: ['jsx', '.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: '[name].bundle.js',
  },
  watchOptions: {
    ignored: '**/node_modules',
  },
  devServer: {
    open: false,
    contentBase: path.join(__dirname, 'dist'),
    hot: true,
    compress: true,
    port: 8080,
    overlay: {
      warnings: true,
      errors: true,
    },
  },
  externalsType: 'script',
  externals: {
    // TODO: try loading mnist from node_modules
    mnist: ['https://unpkg.com/mnist@1.1.0/dist/mnist.js', 'mnist'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'TensorFos',
      templateContent: `
      <html>
        <body>
          <div id="rete"></div>
        </body>
      </html>
    `
    }),
  ],
  optimization: {
    // usedExports: true,
    // 'https://medium.com/hackernoon/the-100-correct-way-to-split-your-chunks-with-webpack-f8a9df5b7758',
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

            // npm package names are URL-safe, but some servers don't like @ symbols
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
};
