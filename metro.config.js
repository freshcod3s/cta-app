// Expo + NativeWind v4. Per Expo SDK 54 docs, metro starts from
// expo/metro-config (not @react-native/metro-config). NativeWind's
// withNativeWind wraps the config and points at global.css.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
