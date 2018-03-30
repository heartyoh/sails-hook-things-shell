const webpack = require('webpack');
const merge = require('webpack-merge');
const package = require('./package.json');

module.exports = function (sails) {

  // Validate hook configuration
  if (!sails.config.webpack || !sails.config.webpack.options) {
    sails.log.warn(package.name + ': No webpack options have been defined.');
    sails.log.warn(package.name + ': Please configure your config/webpack.js file.');
    return {};
  }

  // Sails hook specification
  const hook = {
    emitReady: false,
    afterBuild(err, stats) {
      if (err) return sails.log.error(package.name + ': Build error:\n', err);
      // Emit events
      if (!this.emitReady) {
        sails.emit('hook:' + package.name + ':compiler-ready', {});
        this.emitReady = true;
      }
      sails.emit('hook:' + package.name + ':after-build', stats);
      // Display information, errors and warnings
      stats = stats.toJson();
      sails.log.info(package.name + ': Build complete.');
      if (stats.warnings.length > 0) {
        sails.log.warn(package.name + ': Build warnings:\n', stats.warnings);
      }
      if (stats.errors.length > 0) {
        sails.log.error(package.name + ': Build errors:\n', stats.errors);
      }
    }
  };

  const environment = process.env.NODE_ENV || 'development';
  const baseUrl = sails.config.appUrl;

  // Webpack options
  let options = sails.config.webpack.options;
  // Merge environment-specific options
  if (sails.config.webpack[environment]) {
    options = merge(options, sails.config.webpack[environment]);
  }
  // Merge default options
  options = merge(options, {
    plugins: [
      // User environment variables
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify(environment),
          'BASEURL': JSON.stringify(baseUrl)
        }
      })
    ],
    performance: {
      hints: false
    },
    stats: 'errors-only'
  });

  // // Create webpack compiler
  // hook.compiler = webpack(options, (err, stats) => {
  //   if (err) {
  //     sails.log.error(package.name + ': Configuration error:\n', err);
  //     return {};
  //   }
  //   sails.log.info(package.name + ': Webpack configured successfully.');
  //   if (environment === 'production') {
  //     sails.log.info(package.name + ': Building for production...');
  //     hook.compiler.run(hook.afterBuild.bind(hook));
  //   }
  //   else {
  //     sails.log.info(package.name + ': Watching for changes...');
  //     hook.compiler.watch(sails.config.webpack.watch, hook.afterBuild.bind(hook));
  //   }
  // });

  // // Start webpack-dev-server
  // if (environment !== 'production' && sails.config.webpack.server) {
  //   const WebpackDevServer = require('webpack-dev-server');
  //   // Webpack-dev-server configuration
  //   let config = {
  //     hot: true,
  //     port: 3000
  //   };
  //   Object.assign(config, sails.config.webpack.server);

  //   // Listen on specific port
  //   hook.server = new WebpackDevServer(hook.compiler, config);
  //   hook.server.listen(config.port);
  //   sails.log.info(package.name + ': Server listening on ' + baseUrl);
  // }

  return hook;
};
