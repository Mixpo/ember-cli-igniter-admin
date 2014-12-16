'use strict';

var path = require('path');
var fs   = require('fs');
var util   = require('util');
var writeFile = require('broccoli-file-creator');
var _ = require('lodash-node');

module.exports = {
  name: 'ember-cli-igniter',
  included: function(app) {
    this._super.included.apply(this, arguments);

    // Inject a sass file to set environmental variables.
    var cdnPath = this.project.config(app.env).cdnPath;
    var sassEnvPath = './app/styles/_environment.scss';

    try{
      fs.unlinkSync(sassEnvPath)
    } catch (e) {
      // Do nothing;
    }

    fs.writeFileSync(sassEnvPath, '$asset-domain: "'+ cdnPath + '/" ;');

    // Now inject the cdn path into the index.html file.
    // First, cleanup any old files.
    try{
      fs.unlinkSync('./app/index.html')
    } catch (e) {
      // Do nothing;
    }

    // Search and replace for the path token.
    var indexContent = fs.readFileSync('./app/index.html.dist', 'utf8');
    var result = indexContent.replace(/\{\{CDNPATH\}\}/g, cdnPath);

    // Write the result
    fs.writeFileSync('./app/index.html', result, 'utf8');
  },

  contentFor: function(type, config) {
    var liveReloadPort = process.env.EMBER_CLI_INJECT_LIVE_RELOAD_PORT;


    if(liveReloadPort && type === 'head') {
      var liveReload = _.find(this.project.addons, {name: 'live-reload-middleware'});
      //var content = liveReload.contentFor(type, config);
      var originalContent = liveReload.contentFor(type),
        fullScriptPath = config.cdnPath + '/ember-cli-live-reload.js';

      liveReload.contentFor = function(type) {
        if(liveReloadPort && type === 'head') {
          return originalContent.replace('="/ember-cli-live-reload.js', '="' + fullScriptPath);
        }
      }
    }
  },

  serverMiddleware: function(config) {
    var app = config.app;
    var options = config.options;
    var project = options.project;

    app.use(function(req, res, next) {
      var appConfig = project.config(options.environment);
      res.setHeader('Access-Control-Allow-Origin', options.proxy);
      next();
    });
  }
};