# Running in production

This page outlines three different approaches for running FastBoot in production. Each of these approaches targets a different level of abstraction, so as we move through this guide each approach will decompose into the next.

## FastBoot App Server

We'll start with [FastBoot App Server](https://github.com/ember-fastboot/fastboot-app-server), a fully baked application server made specifically for FastBoot.

FastBoot App Server sits at the highest level of abstraction for running FastBoot in production, mainly due to its built in support for clustering, caching, and compression. It also has the ability to automatically download new builds as they become available.

Here's an example FastBoot App Server.

```js
// server.js

let FastBootAppServer = require('fastboot-app-server');

let server = new FastBootAppServer({
  distPath: '/path/to/dist',
  gzip: true,
  port: 4000,
  chunkedResponse: true
});

server.start();
```

Start the server with `node server.js` and visit http://localhost:4000 to see your FastBoot app.

At its core, FastBoot App Server brings together a handful of common middlewares and patterns you would expect to see in a production node server. One of those middlewares is the FastBoot express middleware, which we'll cover next section.

## FastBoot middleware

If you're looking for more control over your production server we recommend composing the [FastBoot Express Middleware](https://github.com/ember-fastboot/fastboot-express-middleware) with an existing express server.

The middleware lets you respond to HTTP requests with output from your FastBoot application.

And that's it! It has no opinions about compression, clustering, downloading, or anything to do with running a production HTTP server. This makes it a perfect fit for those looking fine tune an express app with their own middlewares and configuration.

Here's how to use the middleware with an existing express app.

```js
// server.js

let express = require('express');
let fastbootMiddleware = require('fastboot-express-middleware');

let app = express();

app.use(fastbootMiddleware('/path/to/dist'));

app.listen(4000);
```

Just like before, we can start the server with `node server.js` and visit http://localhost:4000 to see the FastBoot app.

Internally the FastBoot middleware is a wrapper around FastBoot's core `visit` API, which just so happens to be the subject of the next section.

## FastBoot's visit API

At the lowest level of abstraction we have FastBoot's `visit` API, which you can think of as FastBoot's main entry point to your Ember application. This function takes a URL and returns a promise that fulfills with the HTML generated from FastBoot.

```js
let FastBoot = require('fastboot');

let fastboot = new FastBoot({ dist: 'path/to/dist' });
let result = await fastboot.visit('/');
let html = await result.html();

console.log('The html for the homepage is:', html);
```

You'll notice that this code has nothing to do with a production server, an express app, or even an HTTP request. It's made to take a URL and return a FastBoot response.

Now, often times our FastBoot code depends on an HTTP request and response. For example, our Ember app running in FastBoot may want to peek at the incoming HTTP request's headers, or even write a different HTTP status code when generating its response.

In reality, real FastBoot applications are often tightly coupled to their HTTP requests. For this reason `visit` also takes express HTTP request and response objects as parameters.

Here's some code that will take an express request and call `visit` to generate its HTML.

```js
// server.js

let express = require('express');
let FastBoot = require('fastboot');

let app = express();
let fastboot = new FastBoot({ dist: 'path/to/dist' });

app.use(async function(req, res) {
  let result = await fastboot.visit(req.originalPath, {
    request: req,
    response: res
  });

  let html = await result.html();

  res.send(html);
});

app.listen(4000);
```

Like the previous sections, run `node server.js` and visit http://localhost:4000 to see the FastBoot app.

We've only briefly touched on FastBoot's visit API. More information can be found in the [FastBoot documentation](https://github.com/ember-fastboot/fastboot).
