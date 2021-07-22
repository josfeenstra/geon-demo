const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const PATH_TO_GEON = "../engine";

// setup webpack using the ts-loader
module.exports = (env) => {
    let pack = {
        entry: "./src/index.ts",
        module: {
            rules: [
                {
                    // explain how to compile src
                    test: /\.ts$/,
                    use: "ts-loader",
                    include: [path.resolve(__dirname, "src")],
                },
                {
                    // explain how to compile 'external' library
                    loader: "ts-loader",
                    test: /\.ts$/,
                    include: [path.resolve(__dirname, PATH_TO_GEON, "src")],
                },
            ],
        },
        resolve: {
            // make external library linkable
            extensions: [".ts", ".js"],
            alias: {
                Geon: [path.resolve(__dirname, PATH_TO_GEON, "src/lib")],
                Engine: [path.resolve(__dirname, PATH_TO_GEON, "src")]
            }
        },
        output: {
            filename: "index.js",
            path: path.resolve(__dirname, "public"),
        },
        devServer: {
            filename: "index.js",
            lazy: true,
            contentBase: path.join(__dirname, "public"),
        },
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        keep_fnames: true,
                    },
              }),
            ],
        },
    }

    if (env.eval === "dev") {
        pack.devtool = "eval-source-map";
    }

    return pack;
}
