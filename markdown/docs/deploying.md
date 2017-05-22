# Deploying FastBoot

**NOTE**: This page is out of date, [FastBoot App Server is the current
recommended way](https://github.com/ember-fastboot/fastboot-app-server). This section will
be updated soon, in the meantime, please check FastBoot App Server's readme.

When it comes to deploying FastBoot, there are many off-the-shelf
options that make it easy to get it up and running in production. If
you need something maximally flexible, it's easy to integrate the
FastBoot server into your existing Node.js infrastructure.

## Heroku

Heroku's buildpack for Ember.js supports FastBoot out of the box. With
Heroku, deploying a new version of your app is as simple as typing `git
push heroku`.

To add the Heroku buildpack to your project, see
[heroku-buildpack-emberjs](https://github.com/heroku/heroku-buildpack-emberjs).

## AWS Elastic Beanstalk

Elastic Beanstalk is a service from Amazon Web Services that allows you
to provision Node.js apps and run them in production with minimal ops
overhead.

For more about deploying to Elastic Beanstalk, see
[ember-cli-deploy-elastic-beanstalk](https://github.com/tomdale/ember-cli-deploy-elastic-beanstalk).

## AWS Lambda

Lambda is an AWS service for running Node.js functions without a server.
You can deploy your Ember app as a FastBoot Lambda function, so you
don't have to worry about provisioning servers at all; Amazon will
autoscale based on load. You can serve FastBoot results over HTTP by
combining Lambda with API Gateway.

Lambda is not recommended for serving directly to users, due to
unpredictable response times, but is a perfect fit for pre-rendering or
serving to search crawlers.

For more about deploying FastBoot to Lambda, see [Bustle Labs'
Lambda ember-cli-deploy plugin](https://github.com/bustlelabs/ember-cli-deploy-fastboot-lambda).

## Custom Server

If one of the out-of-the-box deployment strategies doesn't work for you,
you can adapt [the standalone FastBoot
server](https://github.com/ember-fastboot/ember-fastboot-server) to your
needs.

You can use the FastBoot server in one of two ways: as an HTTP server
from the command line, or if you need more customization, as an Express
middleware you can add to your own HTTP server.

### Deploying Your App

When you build your Ember app via `ember build`, it will compile
everything into the `dist` directory. Upload this `dist` directory to your
server. It is the "build artifact" that contains the current version of
your application ready to run in both Node.js and the browser.

Once you've uploaded `dist` to your server, you need to run `npm
install` inside. The `dist` directory contains a `package.json` that
contains all of the dependencies needed to run your app in Node.js. Running
`npm install` makes sure they get installed correctly.

Make sure that you install npm modules in `dist` **after** uploading
`dist` to your server. Any npm packages that have native dependencies
are unlikely to work if compiled ahead of time, unless you're running
the same OS and CPU architecture on both your local machine and server.

### From the Command Line

On your server, install the FastBoot server package globally:

```sh
npm install -g ember-fastboot-server
```

Once installed, you can start the HTTP server by running:

```sh
ember-fastboot path/to/dist --port 80
```

### As a Middleware

If you need maximum customization of your FastBoot server, or if you
just have an existing Node.js infrastructure that you'd like to
integrate FastBoot into, you can use the `ember-fastboot-server` module
as a middleware:

```js
var server = new FastBootServer({
  distPath: 'path/to/dist'
});

var app = express();

app.get('/*', server.middleware());

var listener = app.listen(process.env.PORT || 3000, function() {
  var host = listener.address().address;
  var port = listener.address().port;

  console.log('FastBoot running at http://' + host + ":" + port);
});
```

For more information, see the [FastBoot server
README](https://github.com/ember-fastboot/ember-fastboot-server).
