module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-worklets powers the Reanimated 4 animations (card
    // expand/collapse, breathing glow, slider micro-interactions).
    // This plugin must stay last.
    plugins: ['react-native-worklets/plugin'],
  };
};
