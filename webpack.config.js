const path = require("path")

module.exports = {
	devtool: 'source-map',
	entry: "./index.js",
	output: {
		filename: "ontfs-js-sdk.js",
		path: path.resolve(__dirname, "dist"),
		libraryTarget: "var",
		library: "ontfs",
	},
}
