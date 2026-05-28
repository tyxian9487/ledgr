module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // react-native-worklets/plugin MUST be last — it transforms 'worklet'
    // directives and worklet registration calls for Hermes AOT compilation.
    // Without this, release builds fail at the hermes bytecode step.
    plugins: [
      'react-native-worklets/plugin',
    ],
  };
};
