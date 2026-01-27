module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // NOTE: react-native-reanimated/plugin MUST be the LAST item in the array
      'react-native-reanimated/plugin',
    ],
  };
};