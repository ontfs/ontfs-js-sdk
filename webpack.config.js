const path = require("path")

module.exports = {
	entry: "./index.js",
	output: {
		filename: "ontfs-js-sdk.js",
		path: path.resolve(__dirname, "dist"),
		libraryTarget: "var",
		library: "ontfs",
	},
}
