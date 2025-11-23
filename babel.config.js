module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['expo-env', {
        'module': 'expo-env',
        'path': '.env'
      }]
    ]
  };
};