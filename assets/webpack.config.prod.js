module.exports = {
  mode: "production",
  entry: "/app/assets/js/app.js",
  output: {
    filename: "app.js",
    path: "/app/priv/static/js",
    publicPath: "/assets/"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|deps)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'react', 'stage-2'],
            plugins: []
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)(\?v=[a-z0-9]\.[a-z0-9]\.[a-z0-9])?$/, use: ['url-loader?limit=100000']
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader'
        ]
      },
      {
        test: /\.xml$/,
        use: [
          'xml-loader'
        ]
      }
    ]
  },
}