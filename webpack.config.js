var path = require('path');

module.exports = {
    devtool: 'source-map',
    entry: './bop-lib/index.js',
    output: {
        filename: 'bop-lib.js',
        path: path.resolve(__dirname, 'tmp')
    },
    module: {
        rules: [
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
        ]
    }
};
