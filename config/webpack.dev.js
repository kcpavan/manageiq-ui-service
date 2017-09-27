/* eslint-disable angular/log, no-console */

const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const root = path.resolve(__dirname, '../client')
const outputPath = process.env.BUILD_OUTPUT || '../../manageiq/public/ui/service'
const dist = path.resolve(__dirname, outputPath)
const nodeModules = path.resolve(__dirname, '../node_modules')
const protocol = process.env.PROXY_PROTOCOL || 'http://'
const host = process.env.PROXY_HOST || process.env.MOCK_API_HOST || '[::1]:3000'
const port = process.env.PORT || 3001
const hasSkinImages = fs.existsSync(`${root}/skin/images`)
const appBasePath = process.env.NODE_ENV === 'production' ? "'/ui/service/'" : "'/'"

console.log('Backend proxied on ' + protocol + host)

module.exports = {
  context: root,
  entry: {
    app: './app/main.ts'
  },

  output: {
    chunkFilename: 'js/[name]-[hash].chunk.js',
    filename: 'js/[name]-[hash].js',
    path: dist
  },

  devServer: {
    contentBase: root,
    historyApiFallback: true,
    port: port,
    proxy: {
      '/api': {
        target: `${protocol}${host}`,
        secure: false
      },
      '/pictures': {
        target: `${protocol}${host}`,
        secure: false
      },
      '/ws': {
        target: `ws://${host}`,
        ws: true
      }
    }
  },

  // Output source maps suitable for development
  devtool: 'cheap-module-inline-source-map',

  module: {

    // The rules teach webpack how to resolve different files that are
    // required/imported. Files are resolved by matching their filenames against
    // the test regexes and applying the loaders listed in reverse order. See
    // each loaders README for information on their options.
    rules: [

      // html loaders: populate angular's templateCache
      {
        test: /\.html$/,
        use: [
          `ngtemplate-loader?relativeTo=${root}/`,
          `html-loader?attrs=false&minimize=true`
        ]
      },

      // ts loaders: standard typescript loader
      {
        test: /\.ts$/,
        use: [
          'babel-loader?presets[]=env',
          'ts-loader'
        ]
      },

      // js loaders: transpile based on browserslist from package.json
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'ng-annotate-loader',
          'babel-loader?presets[]=env',
          'standard-loader'
        ]
      },

      // font/images loaders: if smaller than limit embed as data uri
      {
        test: /\.(png|jpg|gif|svg|woff|ttf|eot)/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 20480,
              name: 'styles/[hash].[ext]',

              // Determine publicPath dynamically because in production, assets
              // must be relative to `/ui/service/`
              publicPath: (url) => {
                const path = process.env.NODE_ENV === 'production' ? '/ui/service/' : '/'

                return path + url
              }
            }
          }
        ]
      },

      // css loaders: extract styles to a separate bundle
      {
        test: /\.(css)$/,
        use: ExtractTextWebpackPlugin.extract({
          fallback: 'style-loader',
          allChunks: true,
          use: [
            'css-loader?importLoaders=1&sourceMap=true',
            'postcss-loader'
          ]
        })
      },
      {
        test: /\.(sass|scss)$/,
        use: ExtractTextWebpackPlugin.extract({
          fallback: 'style-loader',
          allChunks: true,
          use: [
            'css-loader?importLoaders=1&sourceMap=true',
            {
              loader: 'sass-loader',
              options: {
                data: `$img-base-path: ${appBasePath}`,
                sourceMap: true,
                includePaths: [
                  `${root}/assets/sass`,
                  `${nodeModules}/bootstrap-sass/assets/stylesheets`,
                  `${nodeModules}/patternfly-sass/assets/stylesheets`,
                  `${nodeModules}/font-awesome/scss`,
                  `${nodeModules}/@manageiq/font-fabulous/assets/stylesheets`
                ]
              }
            }
          ]
        })
      }
    ]
  },

  plugins: [

    // Extract 'styles.css' after being processed by loaders into a single bundle
    new ExtractTextWebpackPlugin('styles/[name]-[hash].css'),

    // Copy all public assets to webpack's processing context
    new CopyWebpackPlugin([
      {from: `${root}/assets`},
      {from: `${root}/gettext`, to: 'gettext'},
      {from: `${nodeModules}/no-vnc`, to: 'vendor/no-vnc'},
      {from: `${nodeModules}/spice-html5-bower`, to: 'vendor/spice-html5-bower'},

      // Override images with skin replacements if they exist
      {from: hasSkinImages ? `${root}/skin/images` : '', to: 'images', force: true}
    ]),

    // Generate index.html from template with script/link tags for bundles
    new HtmlWebpackPlugin({
      base: '/',
      template: '../client/index.ejs'
    }),

    // Fix circular dependency error:
    // https://github.com/angular/angular/issues/11580#issuecomment-282705332
    new webpack.ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)@angular/,
      root
    )
  ],

  resolve: {
    extensions: ['.ts', '.js'],
    symlinks: false
  },

  // Disables noisy performance warnings. While the warnings are important, it
  // is not feasible to satisfy the recommendations until we start code splitting
  performance: {
    hints: false
  }
}
