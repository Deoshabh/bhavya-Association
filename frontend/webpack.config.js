module.exports = {
  devServer: {
    client: {
      overlay: {
        warnings: false
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: /node_modules/
      }
    ]
  }
};
