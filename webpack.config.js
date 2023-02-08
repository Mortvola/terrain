const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');

const config = (name, env) => ({
  name,
  mode: env.production ? 'production' : 'development',
  devtool: env.production ? 'source-map' : 'inline-source-map',
  entry: `./client-web/${name.charAt(0).toUpperCase()}${name.slice(1)}.tsx`,
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: `${name}.js`,
    assetModuleFilename: 'images/[name][ext]',
  },
  module: {
    rules: [
      { test: /.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: {
                exportLocalsConvention: 'camelCaseOnly',
                localIdentName: '[name]-[local]-[hash:base64:5]',
              },
              importLoaders: 1,
              sourceMap: env.production === undefined,
            },
          },
        ],
        include: /\.module\.css$/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
        exclude: /\.module\.css$/,
      },
      {
        test: /\.(vert|frag)$/,
        use: {
          loader: 'webpack-glsl-loader',
        },
      },
    ],
  },
  plugins: [
    new RemovePlugin({
      before: {
        test: [
          {
            folder: './public',
            method: (file) => (name === 'app' ? /main\..*\.css/.test(file) : false),
            recursive: false,
          },
          {
            folder: './public',
            method: (file) => (name === 'welcome' ? /welcome\..*\.css/.test(file) : false),
            recursive: false,
          },
        ],
      },
    }),
    new MiniCssExtractPlugin({
      filename: name === 'app'
        ? 'main.[contenthash].css'
        : 'welcome.[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      inject: false,
      publicPath: '/',
      filename: `../resources/views/${name === 'app' ? 'home' : 'welcome'}-css.edge`,
      templateContent: (param) => (
        `<link rel="preload" href="${param.htmlWebpackPlugin.files.css}" as="style" onload="this.onload=null;this.rel='stylesheet'">`
      ),
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
})

module.exports = [
  (env) => config('app', env),
];
