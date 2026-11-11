const Path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const {
  build: { productName: APP_NAME }
} = require("./package.json")

module.exports = (_env, argv) => {
  const isDev = argv.mode === "development"

  return {
    target: "web",
    entry: "./src/renderer/src/main.tsx",
    output: {
      path: Path.resolve(__dirname, "dist/renderer"),
      filename: "js/[name].[contenthash:8].js",
      clean: true
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
      alias: {
        "@shared": Path.resolve(__dirname, "src/shared")
      }
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.web.json"
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            isDev ? "style-loader" : MiniCssExtractPlugin.loader,
            "css-loader",
            "postcss-loader"
          ]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/renderer/index.html",
        title: APP_NAME
      }),
      ...(!isDev
        ? [
            new MiniCssExtractPlugin({
              filename: "css/[name].[contenthash:8].css"
            })
          ]
        : [])
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*"
      }
    },
    devtool: isDev ? "eval-source-map" : false
  }
}
