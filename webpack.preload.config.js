const Path = require('path');

module.exports = (_env, argv) => ({
  target: 'electron-preload',
  entry: './src/preload/index.ts',
  output: {
    path: Path.resolve(__dirname, 'dist/preload'),
    filename: 'index.js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@shared': [Path.resolve(__dirname, 'src/shared')],
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.node.json',
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  devtool: argv.mode === 'development' ? 'source-map' : false,
});
