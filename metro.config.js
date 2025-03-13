// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require("nativewind/metro");

// const config = getDefaultConfig(__dirname);

// // Ensure Metro handles .txt files
// config.resolver.assetExts.push("txt");

// module.exports = withNativeWind(config, { input: "./app/global.css" });


const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure Metro handles .txt files
config.resolver.assetExts.push("txt");

// Fix for missing Node.js modules in React Native
config.resolver.extraNodeModules = {
  string_decoder: require.resolve("string_decoder/")
};

module.exports = withNativeWind(config, { input: "./app/global.css" });
