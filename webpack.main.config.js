const Path = require("path")
const { createSwcRules } = require("./webpack.swc")

module.exports = (_env, argv) => ({
  target: "electron-main",
  entry: "./src/main/index.ts",
  output: {
    path: Path.resolve(__dirname, "dist/main"),
    filename: "index.js",
    clean: true
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@shared": Path.resolve(__dirname, "src/shared")
    }
  },
  module: {
    rules: createSwcRules({ development: argv.mode === "development" })
  },
  node: {
    __dirname: false,
    __filename: false
  },
  devtool: argv.mode === "development" ? "source-map" : false
})
