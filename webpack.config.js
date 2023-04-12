const path = require("path");
const nodeExternals = require("webpack-node-externals");
module.exports = {
  entry: "./start.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "api.bundle.js"
  },
  externals: [nodeExternals()],
  target: "node"
};
