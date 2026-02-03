const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable support for package.json "exports" field
config.resolver.unstable_enablePackageExports = true;

// Ensure we pick up the right entry points
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add support for ESM and proper resolution of files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs', 'js', 'json'];

module.exports = config;
