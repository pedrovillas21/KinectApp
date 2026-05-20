const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-linear-gradient': path.resolve(
    __dirname,
    'node_modules/expo-linear-gradient'
  ),
};

module.exports = config;
