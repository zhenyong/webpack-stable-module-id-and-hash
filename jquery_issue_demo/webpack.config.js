var webpack = require('webpack');
var StableModuleIdAndHash = require('../index');

module.exports = {
    entry: './entry.js',
    output: {
        path: __dirname,
        filename: 'bundle.js',
    },
    module: {
        loaders: [
            {
                test: require.resolve('jquery'),
                loader: "expose?$!expose?jQuery",
            },
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
        }),
        new StableModuleIdAndHash(), // 提示错误 Error: webpack-stable-module-id-and-hash module id collision
    ],
};
