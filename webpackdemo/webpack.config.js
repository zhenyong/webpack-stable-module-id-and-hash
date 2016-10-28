var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var StableModuleIdAndHash = require('../index');

module.exports = {
    entry: {
        pageA: './src/pageA.js',
        pageB: './src/pageB.js',
    },
    output: {
        path: __dirname + '/build',
        filename: '[name].[chunkhash:4].js',
        chunkFilename: "[id].[chunkhash:4].bundle.js",
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
        }],
        xloaders: [{
            test: /\.css$/,
            loader: 'style!css',
        }]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: "commons",
            minChunks: 2,
            chunks: ["pageA", "pageB"],
        }),

        // new webpack.optimize.CommonsChunkPlugin({
        //     name: "manifestA",
        //     chunks:['pageA']
        // }),

        // new webpack.optimize.CommonsChunkPlugin({
        //     name: "manifestB",
        //     chunks:['pageB']
        // }),
        new StableModuleIdAndHash(),
        new ExtractTextPlugin('[name].[contenthash:4].css'),
    ],
};
