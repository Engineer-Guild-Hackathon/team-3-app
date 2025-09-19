const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

const defaultWatchFolders = config.watchFolders ?? [];
config.watchFolders = Array.from(new Set([...defaultWatchFolders, workspaceRoot]));

const defaultNodeModules = config.resolver?.nodeModulesPaths ?? [];
const projectNodeModules = path.resolve(projectRoot, 'node_modules');
const workspaceNodeModules = path.resolve(workspaceRoot, 'node_modules');
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: Array.from(
    new Set([...defaultNodeModules, projectNodeModules, workspaceNodeModules])
  ),
  disableHierarchicalLookup: false,
  assetExts: (config.resolver?.assetExts ?? []).filter((ext) => ext !== 'svg'),
  sourceExts: [...new Set([...(config.resolver?.sourceExts ?? []), 'svg'])],
};

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

module.exports = config;
