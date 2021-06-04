const path = require('path')
const fs = require('fs')
const webpack = require("webpack")
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ProgressBarPlugin = require("progress-bar-webpack-plugin")
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const env = process.env.NODE_ENV || 'dev'
const isDev = env === 'dev'
const version = 'reactAlginTool-1.0.0'
const lessModuleRegex = /\.module\.less$/

module.exports = () => {
  const options = {
    mode: isDev ? 'development' : 'production',
    entry: isDev ? './example/index' : path.resolve(__dirname, 'src/index'),
    output: {
      publicPath: isDev ? '/' : './',
      library: 'reactAlginTool',
      libraryTarget: 'umd', // 注意这里按 umd 模块规范打包
      umdNamedDefine: true, // 是否将模块名称作为 AMD 输出的命名空间
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].min.js',
      libraryExport: 'default', // 将default默认导出, 不然会 window['xx'].default
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    devServer: {
      compress: !isDev,
      clientLogLevel: 'warning',
      hot: true,
      inline: true,
      port: 8888
    },
    module: {
      rules: [
        {
          test: /\.(j|t)s[x]?$/,
          use: [{
            loader: require.resolve('babel-loader'),
            options: {
              cacheDirectory: true,
            },
          }],
          include: [
            path.join(__dirname, 'src'),
            path.join(__dirname, 'example'),
          ],
        },
        {
          test: /\.(le|c)ss$/,
          exclude: [/\.module\.css$/, lessModuleRegex],
          use: isDev
            ? [
              { loader: "style-loader" },
              {
                loader: "css-loader",
                options: {
                  importLoaders: 1
                }
              },

              {
                loader: "postcss-loader",
                options: { sourceMap: true }
              },
              {
                loader: "less-loader",
                options: {
                  sourceMap: true,
                  lessOptions: {
                    javascriptEnabled: true
                  }
                }
              }]
            : [MiniCssExtractPlugin.loader,
              'css-loader',
              'postcss-loader',
            {
              loader: "less-loader",
              options: {
                sourceMap: false,
                // lessOptions: {
                //   javascriptEnabled: true
                // }
              }
            }
            ],
        },
        {
          test: lessModuleRegex,
          include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'example')],
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: require.resolve('css-loader'),
              options: {
                importLoaders: 2,
                modules: {
                  localIdentName: '[name]-[local]-[hash:base64:5]'
                },
              },
            },
            'postcss-loader',
          ],
        }
      ]
    },
    resolve: {
      extensions: [".js", ".jsx", ".json", ".less", ".css", ".ts", ".tsx"],
      enforceExtension: false,
    },
    // optimization: {
    //   concatenateModules: true,
    //   splitChunks: {
    //     chunks: "all",
    //     maxInitialRequests: Infinity,
    //     minSize: 0,
    //     cacheGroups: {
    //       vendors: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: "vendors"
    //       },
    //       commons: {
    //         name: "commons",
    //         minChunks: 2,
    //         chunks: "initial"
    //       },
    //       styles: {
    //         name: "styles",
    //         test: /\.css$/,
    //         chunks: "all",
    //         minChunks: 2,
    //         enforce: true
    //       }
    //     }
    //   },
    //   minimizer: isDev
    //     ? []
    //     : [
    //       new UglifyJsPlugin({
    //         cache: true,
    //         parallel: true,
    //         sourceMap: false,
    //         uglifyOptions: {
    //           compress: {
    //             drop_debugger: false,
    //             drop_console: false  //调试打时开
    //           }
    //         }
    //       }),
    //       new OptimizeCssAssetsPlugin({
    //         cssProcessor: require("cssnano"),
    //         cssProcessorOptions: { discardComments: { removeAll: true } },
    //         canPrint: true
    //       })
    //     ],
    // },
    plugins: [
      new ProgressBarPlugin(),
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
      }),
      new webpack.ProvidePlugin({
        React: 'react',
      }),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
        options: {
          runtimeChunk: {
            name: "runtime"
          }
        }
      })
    ],
  }
  if (isDev) {
    options.plugins = options.plugins.concat([
      new webpack.HotModuleReplacementPlugin(),
      new HtmlWebpackPlugin({
        title: "align-tool",
        filename: "index.html",
        inject: true,
        template: path.resolve(__dirname, "./example/index.html"),
        hash: false
      })
    ])
    options.devtool = 'cheap-module-eval-source-map'
  } else {
    options.externals = {
      react: {
        root: 'React',
        commonjs2: 'react',
        commonjs: 'react',
        amd: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs2: 'react-dom',
        commonjs: 'react-dom',
        amd: 'react-dom',
      },
    }
    options.plugins = options.plugins.concat([
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: 'assets/[name].css',
        chunkFilename: 'assets/[name].css',
      }),
      new webpack.BannerPlugin(`${version} \n ${fs.readFileSync(path.resolve(__dirname, './LICENSE'))}`)
    ])
  }

  return options
}