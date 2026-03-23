const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure react-dom resolves correctly for expo-router's log-box overlay
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
