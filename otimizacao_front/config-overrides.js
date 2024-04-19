const webpack = require('webpack');

module.exports = function override(config, env) {
  // Adiciona polifilamentos para módulos como 'stream', 'buffer', etc.
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer/"),
    "assert": require.resolve("assert/")
  };

  // Fornece variáveis globais para polifilamentos de buffer e process
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];

  return config;
};
