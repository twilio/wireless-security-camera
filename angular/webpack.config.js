var path = require("path");
var webpack = require("webpack");

module.exports = {
  cache: true,
  // Group dependencies into different entries and use CommonsChunkPlugin to share
  // the common parts and generate smaller chunks
  entry: {
    "index": "./js/index.js",
    "styles": [
        "./scss/main.scss",
    ],
    "vendor": [
        "bootstrap", "bootstrap-webpack",
        "moment",
        "crypto",
    ]
  },
  // use externals to exclude components that are statically included from CDNs
  externals: {
    "jquery": 'jQuery',
    "twilio-sync": "Twilio.Sync",
    "angular": "angular",
    "angular-route": { amd: "angular-route" }, 
  },
  output: {
    path: path.join(__dirname, "build", "assets"),
    publicPath: "/assets/",
    filename: "[name].js",
    chunkFilename: "[name]-[chunkhash].js"
  },
  module: {
    loaders: [
      // required to write "require('./style.css')"
      { test: /\.css$/,    loader: "style-loader!css-loader" },

      // required to write "require('./style.scss')"
      {
        test: /\.scss$/,   use: [{
            loader: "style-loader"
          }, {
            loader: "css-loader"
          }, {
            loader: "sass-loader",
            options: {
              includePaths :
                require('node-bourbon').includePaths
            }
          }]
      },

      // required for bootstrap icons
      { test: /\.woff$/,   loader: "url-loader?limit=5000&mimetype=application/font-woff" },
      { test: /\.woff2$/,  loader: "url-loader?limit=5000&mimetype=application/font-woff2" },
      { test: /\.ttf$/,    loader: "file-loader" },
      { test: /\.eot$/,    loader: "file-loader" },
      { test: /\.svg$/,    loader: "file-loader" },

      // generate index.html
      { test: /\/index\.html$/, loader : "file-loader?name=index.html" },

      { test: /views\/\w+\.html$/, loader: "ngtemplate-loader?relativeTo=" + __dirname + "/!html-loader" }
    ]
  },
  devtool: 'source-map',
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
        names: ['styles', 'vendor'],
        minChunks: Infinity
    }),
  ]
};
