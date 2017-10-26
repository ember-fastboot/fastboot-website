'use strict';

const fs = require('fs');
const express = require('express');
const cluster = require('express-cluster');
const fastbootMiddleware = require('fastboot-express-middleware');
const parseArgs = require('minimist');
const staticGzip = require('express-serve-static-gzip');
const sabayon = require('express-sabayon');

var assetPath = 'tmp/deploy-dist'
var port = process.env.PORT || 3000;

console.log('Booting Ember app...');

try {
  fs.accessSync(assetPath, fs.F_OK);
} catch (e) {
  console.error(`The asset path ${assetPath} does not exist.`);
  process.exit(1);
}


// FastFail™: this is not mandatory; the first call to visit would
// also boot the app anyway. This is just to provide useful feedback
// instead of booting a server that keeps serving 500.
//
// Note that Application#buildApp is still a private API atm, so it might
// go through more churn in the near term.
console.log('Ember app booted successfully.');
cluster(function() {
  var app = express();

  var fastboot = fastbootMiddleware(assetPath);

  if (assetPath) {
    app.get('/', fastboot);
    app.use(staticGzip(assetPath)),
      app.use(express.static(assetPath, {
        setHeaders(res, path, stat) {
          res.setHeader('Cache-Control', 'public, max-age=365000000, immutable');
          res.removeHeader('X-Powered-By');
        }
      }));
  }

  app.get(sabayon.path, sabayon.middleware());
  app.get('/*', fastboot);

  var listener = app.listen(port, function() {
    var host = listener.address().address;
    var port = listener.address().port;
    var family = listener.address().family;

    if (family === 'IPv6') { host = '[' + host + ']'; }

    console.log('Ember FastBoot running at http://' + host + ":" + port);
  });
}, { verbose: true });
