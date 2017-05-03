# User Guide

## Introduction

FastBoot brings server-side rendering to Ember.js applications.
By performing initial renders on the server, your Ember app is accessible to search engines, `curl`, and other scrapers.
Users see content faster, and can view your app even if they have JavaScript disabled or the JavaScript files fail to load.

## How It Works

FastBoot works by creating a Node.js process and executing your Ember application within it.

Most Ember applications should work out of the box.
However, there are some patterns that you should be sure to follow to guarantee that your application is fully FastBoot compatible.
See [Tips and Tricks](#tips-and-tricks) below for a full list.

## Introduction Video

[![Introduction to Ember FastBoot](https://i.vimeocdn.com/video/559399270_640x360.jpg)](https://vimeo.com/157688134)

## Installation

FastBoot is an addon you can add to existing Ember CLI apps.
To FastBoot-enable your application, run:

```sh
ember install ember-cli-fastboot
```

This will install the `ember-cli-fastboot` addon via npm and save it to your application's `package.json`.

## Testing Locally

You can start a FastBoot server on your development machine by running:

```sh
ember fastboot
```

This starts a FastBoot server listening on port 3000\.
You can verify it's working by curling from `localhost`:

```sh
curl http://localhost:3000
```

You should see the content of your application's index template rendered in the output, instead of the empty HTML most client-side rendered apps show.

To stop the server, press `Ctrl-C` on your keyboard to kill the process.

Note that, at the moment, the server does not automatically restart when you make changes.
If you make changes to your application, you'll need to kill the server and restart it.

You can run the development server on a different port by passing the `--port` argument:

```sh
ember fastboot --port 4567
```

*Note*: `ember fastboot` command is soon going to be deprecated.

## Testing Locally using `ember serve`

If your app is running ember-cli 2.12.0-beta.1 and above, you can now serve your FastBoot rendered content with `ember serve` as well. Moreover, all options of `ember serve` will work with FastBoot (example `--proxy`, `--port`, `--live-reload` etc). The Node server will automatically restart when you make changes.

In order to serve the CSS, JavaScript, images in addition to rendering the server side content, just run:

```sh
ember serve
```

View the FastBoot-rendered by visiting [localhost:4200](http://localhost:42000/). You can alternatively also use the following curl command: `curl 'http://localhost:4200/' -H 'Accept: text/html'`.

### Disabling FastBoot

You can also turn off the server side rendering on a per request basis using `fastboot` query parameter. To disable FastBoot rendered content, visit [localhost:4200/?fastboot=false](http://localhost:4200/?fastboot=false). You can enable FastBoot rendered content again by visiting [localhost:4200/?fastboot=true](http://localhost:4200/?fastboot=true).


## Building for Production

Once you've installed the FastBoot addon, a Node-compatible build of your app is automatically included when you run `ember build`.
As with any other Ember build, you'll want to build for the production environment when deploying for your users to use:

```sh
ember build --environment production
```

**You are strongly encouraged to automate deploys using [Ember CLI Deploy][ember-cli-deploy].**
There are a number of FastBoot-compatible deploy plugins, with more being authored every day.

Manual deployment is slow and error-prone, and even if you have a custom deployment process, writing an Ember CLI Deploy plugin is straightforward and will save you time and energy in the future.

As with a standard Ember build for the browser, compiled assets by default go in your application's `dist` directory.
FastBoot adds two additions:

1. `dist/package.json`, which contains metadata about your app for consumption by the FastBoot server.
2. `dist/fastboot/`, which contains your app's compiled JavaScript that is evaluated and run by the FastBoot server.

For more information, see the [Architecture](#architecture) section.

## The FastBoot Service

FastBoot registers the `fastboot` [service](https://guides.emberjs.com/v2.7.0/applications/services/) which you can inject into your application:

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),
  isFastBoot: Ember.computed.reads('fastboot.isFastBoot'),

  // ... Application code
});
```

This service contains several useful objects and methods you can use to manage an application's state when it is being FastBooted.

Property         | Description
---------------- | ---------------------------------------------------------------------------------------------------------
`isFastBoot`     | Equals `true` if your application is running in FastBoot
`response`       | The FastBoot server's response
`request`        | The request sent to the FastBoot server
`shoebox`        | A key/value store for passing data acquired server-side to the client
`deferRendering` | A function that takes a `Promise` that you can use to defer the Ember application's rendering in FastBoot

### Deferring Response Rendering

By default, FastBoot waits for the `beforeModel`, `model`, and `afterModel` hooks to resolve before sending a response back to the client.
You can use these hooks to defer rendering of your application.
See [Defer Rendering with Model Hooks](#defer-rendering-with-model-hooks).

If you have asynchronous code that runs outside of these lifecycle hooks, you will want to use `deferRendering` to block the response. `deferRendering` function accepts a `Promise` and will chain all promises passed to it.
FastBoot will wait for these promises to resolve before sending the response to the client.

You must call `deferRendering` before these model hooks complete.
For example, if you made an asynchronous call in a Component, you would use `deferRendering` in the `init` lifecycle hook.

### FastBoot Request

The `fastboot.request` key allows you access to the request sent to the FastBoot server.

#### Access Request Headers

You can access the current request headers via `fastboot.request`.
The `headers` object implements part of the [Fetch API's Headers class](https://developer.mozilla.org/en-US/docs/Web/API/Headers), the functions available are [`has`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/has), [`get`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/get), and [`getAll`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getAll).
For more information about HTTP headers see [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers).

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let headers = this.get('fastboot.request.headers');
    let xRequestHeader = headers.get('X-Request');
    // ...
  }
});
```

#### Request Cookies

You can access cookies for the current request via `fastboot.request` in the `fastboot` service.

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let authToken = this.get('fastboot.request.cookies.auth');
    // ...
  }
});
```

The FastBoot service's `cookies` property is an object containing the request's cookies as key/value pairs.

#### Request Host

You can access the host of the request that the current FastBoot server is responding to via `fastboot.request` in the `fastboot` service.
The `host` property will return the full `hostname` and `port` (`example.com` or `localhost:3000`).
For example, when requesting `http://myapp.example.com/photos` from your browser, `fastboot.request.host` would equal `myapp.example.com`

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let host = this.get('fastboot.request.host');
    // ...
  }
});
```

Retrieving `host` will error on 2 conditions:

1. You do not have a `hostWhitelist` defined.
2. The `Host` header does not match an entry in your `hostWhitelist`.

##### The Host Whitelist

For security, you must specify a `hostWhitelist` of expected hosts in your application's `config/environment.js`:

```javascript
module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'host',
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      // ...
    },
    APP: {
      // ...
    },

    fastboot: {
      hostWhitelist: ['example.com', 'subdomain.example.com', /^localhost:\d+$/]
    }
  };
  // ...
};
```

`hostWhitelist` entries can be a `String` or `RegExp` to match multiple hosts.

##### Security

Be careful with `RegExp` entries because host names are checked against the `Host` HTTP header, which can be forged.
An improperly constructed `RegExp` could open your FastBoot servers and any backend they use to malicious requests.

#### Query Parameters

You can access query parameters for the current request via `fastboot.request` in the `fastboot` service.

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let authToken = this.get('fastboot.request.queryParams.auth');
    // ...
  }
});
```

The service's `queryParams` property is an object containing the request's query parameters as key/value pairs.

#### Path

You can access the path (`/` or `/some-path`) of the request that the current FastBoot server is responding to via `fastboot.request` in the `fastboot` service.

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let path = this.get('fastboot.request.path');
    // ...
  }
});
```

#### Protocol

You can access the protocol (`http` or `https`) of the request that the current FastBoot server is responding to via `fastboot.request` in the `fastboot` service.

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let protocol = this.get('fastboot.request.protocol');
    // ...
  }
});
```

### FastBoot Response

FastBoot Response gives you access to the response metadata that FastBoot will send back the client.

#### Response Headers

You can access the current response headers via `fastboot.response.headers`.
The `headers` object implements part of the [Fetch API's Headers class](https://developer.mozilla.org/en-US/docs/Web/API/Headers), the functions available are [`has`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/has), [`get`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/get), and [`getAll`](https://developer.mozilla.org/en-US/docs/Web/API/Headers/getAll).

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let isFastBoot = this.get('fastboot.isFastBoot');

    if (isFastBoot) {
      let resHeaders = this.get('fastboot.response.headers');
      resHeaders.set('X-Debug-Response-Type', 'fastboot');
    }
    // ...
  }
});
```

#### Status Code

You can access the status code of the current response via `fastboot.response.statusCode`.
This is useful if you want your application to return a non-default (`200`) status code to the client.
For example if you want a route of your application to be `401 - Unauthorized` if it accessed without OAuth credentials, you could use `statusCode` to do that.

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  beforeModel() {
    let isFastBoot = this.get('fastboot.isFastBoot');

    if (!isFastBoot) {
      return;
    }

    let reqHeaders = this.get('fastboot.request.headers');
    let authHeaders = reqHeaders.get('Authorization');

    if (authHeaders === null) {
      this.set('fastboot.response.statusCode', 401);
    }
    // ...
  }
});
```

FastBoot handles `200`, [`204` and `3xx`](https://github.com/ember-fastboot/fastboot/blob/b62e795c8c21c4a5dca09f2cf20e4367c843fc7b/src/result.js#L27-L43) by default.
For other custom responses you will want to modify your application and FastBoot server implementation to act accordingly.

### Using a different index.html file

FastBoot's default behavior is to inject HTML that your application has rendered into the `<head>` and `<body>` sections of the application's `index.html` file.
In some cases you may want to use different HTML boilerplate for your application. For instance, [AMP](https://www.ampproject.org/) pages have a rigid structure
that they must adhere to, so if you are using Ember to generate a valid AMP page you will need to change the `index.html` file that FastBoot uses.
To do so, specify an `htmlFile` in your application's `config/environment.js`:

```javascript
module.exports = function(environment) {
  var ENV = {
    // ...

    fastboot: {
      htmlFile: 'custom-index.html'
    }
  };
};
```

FastBoot will look for this file in your `dist/` directory when serving your application.
You can put your custom html file in your application's `public/` directory and `ember-cli` will
copy it to the correct location in the `dist/` directory when building. This should be a standard HTML file
(no handlebars) with comment placeholders `<!-- EMBER_CLI_FASTBOOT_HEAD -->` and
`<!-- EMBER_CLI_FASTBOOT_BODY -->` that FastBoot will replace with your application's `<head>` and `<body>` content, respectively.

### The Shoebox

The Shoebox lets you pass application state from your FastBoot rendered application to the browser for client-side rendering.
For example if your FastBoot server makes an API request, you can use the Shoebox to pass data to the client's browser.
When the application resumes rendering on the client-side, it will be able to use that data, eliminating the need for it to make an API request of its own.

The contents of the Shoebox are written to the HTML as strings within `<script>` tags by the server rendered application, which are then consumed by the browser rendered application.

This looks like:

```html
.
.
<script type="fastboot/shoebox" id="shoebox-main-store">
{"data":[{"attributes":{"name":"AEC Professionals"},"id":106,"type":"audience"},
{"attributes":{"name":"Components"},"id":111,"type":"audience"},
{"attributes":{"name":"Emerging Professionals"},"id":116,"type":"audience"},
{"attributes":{"name":"Independent Voters"},"id":2801,"type":"audience"},
{"attributes":{"name":"Staff"},"id":141,"type":"audience"},
{"attributes":{"name":"Students"},"id":146,"type":"audience"}]}
</script>
.
.
```

#### Putting and Retrieving

`shoebox.put` lets you add items to the Shoebox.

`shoebox.retrieve` lets you remove items from the Shoebox.

In the example below, we find and store our data in a `shoeboxStore` object, when the application is rendered in FastBoot.
When the same code is then executed by the client browser, we retrieve the items from the `shoeboxStore` rather than redoing the find (and triggering a network request).

```javascript
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model(params) {
    let shoebox = this.get('fastboot.shoebox');
    let shoeboxStore = shoebox.retrieve('my-store');
    let isFastBoot = this.get('fastboot.isFastBoot');

    if (isFastBoot) {
      return this.store.findRecord('post', params.post_id).then(post => {
        if (!shoeboxStore) {
          shoeboxStore = {};
          shoebox.put('my-store', shoeboxStore);
        }
        shoeboxStore[post.id] = post.toJSON();
      });
    }

    return shoeboxStore && shoeboxStore[params.post_id];
  }
});
```

## Useful Ember Addons for FastBoot

### ember-network: Fetch Resources Over HTTP (AJAX)

JavaScript running in the browser relies on the `XMLHttpRequest` interface to retrieve resources, while Node offers the `http` module.
What do we do if we want to write a single app that can fetch data from our API server when running in both environments?

One option is to use the [ember-network] addon, which provides an implementation of [Fetch API][fetch-api] standard that works seamlessly in both environments.

To use `ember-network`, install it as you would any addon:

```sh
ember install ember-network
```

Once installed, you can import it using the JavaScript module syntax, wherever you need to make a network request:

```javascript
import fetch from 'ember-network/fetch';
```

The `fetch()` method returns a promise and is very similar to jQuery's `getJSON()` method that you are likely already using.
For example, here's an Ember route that uses `fetch()` to access the GitHub JSON API and use it as the route's model:

```javascript
import Route from 'ember-route';
import fetch from 'ember-network/fetch';

export default Route.extend({
  model() {
    return fetch('https://api.github.com/users/tomdale/events')
      .then(function(response) {
        return response.json();
      });
  }
});
```

For more information, see [ember-network] and the [Fetch documentation on MDN][fetch-api].

### ember-cli-document-title: Specify the Page Title

To control the title that gets displayed for a route (i.e., the `<title>` tag), install the FastBoot-compatible `ember-cli-document-title` addon:

```sh
ember install ember-cli-document-title
```

This addon allows you to specify the page title by adding a `title` property to your application's routes.

```javascript
// routes/post.js
export default Ember.Route.extend({
  titleToken: function(model) {
    return model.get('name');
  }
});
```

See [ember-cli-document-title] for more information.

### ember-cli-head: Enable Open Graph, Twitter Cards and Other `<head>` Tags

FastBoot makes your Ember application accessible to services that embed content, such as Twitter's cards and Facebook posts.
You can customize how your site appears in these contexts with `<meta>` tags driven dynamically by your Ember app.

To get started, install the `ember-cli-head` addon:

```sh
ember install ember-cli-head
```

The `ember-cli-head` addon works by giving you a Handlebars template that is rendered into your application's `<head>` tag.
To configure what gets rendered, edit the newly-created `app/templates/head.hbs` file.

For example, to set the title used when embedding a route in Facebook (or any other Open Graph-compatible app), add the appropriate `<meta>` tag to `head.hbs`:

```hbs
{{!-- app/templates/head.hbs --}}
<meta property="og:title" content={{model.title}} />
```

This creates a `<meta>` tag whose `property` attribute is `og:title`.
Now we just need to tell it what the title is, which is typically determined dynamically by the current route's model:

```javascript
import Ember from 'ember';

export default Ember.Route.extend({
  // This service is the `model` in the head.hbs template,
  // so any properties you set on it are accessible via
  // `model.whatever`.
  headData: Ember.inject.service(),

  afterModel(model) {
    let title = model.get('title') || "Untitled";
    this.set('headData.title', title);
  }
});
```

For more information, see [ember-cli-head].

## Tips and Tricks

### Using Whitelisted Node Dependencies

The browser and Node are two different environments, and functionality in one is not always available in the other.
As you develop your app, you may need to pull in additional dependencies to provide for functionality not available by default in Node.

For example, `localStorage` is not available in Node and you may instead want to save information to a Redis server by using the `radredis` npm packge.

For security reasons, your Ember app running in FastBoot can only access packages (both built-in and from npm) that you have explicitly whitelisted.

To allow your app to require a package, add it to the `fastbootDependencies` array in your app's `package.json`:

```javascript
{
  "name": "my-sweet-app",
  "version": "0.4.2",
  "devDependencies": {
    // ...
  },
  "dependencies": {
    "radredis": "0.1.1"
  },
  "fastbootDependencies": [
    "radredis",
    "path"
  ]
}
```

The `fastbootDependencies` in the above example means the only modules your Ember app can use are `radredis` (provided from npm) and `path` (a built-in Node module).

If the package you are using is not built in to Node, **you must also specify the package and a version in the `package.json` `dependencies` hash.** Built-in modules (`path`, `fs`, etc.) only need to be added to `fastbootDependencies`.

From your Ember app, you can run `FastBoot.require()` to require a package.
This is identical to the CommonJS `require` except it checks all requests against the whitelist first.

```javascript
if (typeof FastBoot !== 'undefined') {
  let path = FastBoot.require('path');
  let filePath = path.join('tmp', session.getID());
}
```

If you attempt to require a package that is not in the whitelist, FastBoot will raise an exception.

Note that the `FastBoot` global is **only** available when running in FastBoot mode.
You should either guard against its presence or only use it in FastBoot-only initializers.

### Use Model Hooks to Defer Rendering

An Ember app running in the browser is long-lived: as soon as the page loads, you can start rendering parts of the UI as soon as the data driving that UI becomes available.

Ember starts by collecting the models for each route on screen (via `Route`'s `model()`, `beforeModel()`, and `afterModel()` hooks).
If any of your routes return a promise from one of these hooks, Ember will wait until those promises resolve before rendering the templates.
This avoids a jarring "pop-in" effect.

Sometimes, though, you don't want secondary UI to block the main content.
For example, imagine an app for managing contacts.
It shows information for one contact, as well as a list of all contacts in the sidebar.

You may not want to wait for the entire list of contacts to load before showing the primary information the user is after: details about a specific contact.
So, once the `model()` hook finishes loading for the route, the template is rendered, and the sidebar shows a loading spinner while the full list is loaded.

![](images/contacts-example.png)

In the browser, the router's promise chain controls when the template is rendered.
But you can always render immediately (by not returning a promise) and have each component on the page update once its backing data becomes available.

FastBoot is different.
Because it's sending a static page of HTML to the user's browser, it needs to know when the page is "done." As soon as FastBoot thinks the page is done rendering, it converts the DOM into HTML, sends it to the browser, and destroys the application instance.

Like when deciding when to render a route's templates, FastBoot uses the promise chain built by routes' `beforeModel()`, `model()`, and `afterModel()` hooks.
But if some components are responsible for marshalling their own data, they may render too late for the HTML response and the user (or the search crawler!) may see the loading state instead of the content you intended.

To work around this, you can add additional promises to the `afterModel()` hook when in FastBoot mode that block rendering until all of the data is loaded.
Use services to coordinate between the route and the components on the page.

For example, let's imagine we're building a news page that also has a weather widget.
In the browser, we load the primary model (the article) in the `model()` hook.
The weather component fetches data from a `weather` service.

In the browser, we let the weather component render a loading spinner if the article loads before the weather data.
But in FastBoot, we block rendering until the weather data is available.

Here's what the `Route` for that page might look like:

```javascript
// app/routes/article.js
import Route from 'ember-route';

export default Route.extend({
  fastboot: Ember.service.inject(),
  weather: Ember.service.inject(),

  model({ article_id }) {
    return this.store.find('article', article_id);
  },

  afterModel() {
    if (this.get('fastboot.isFastBoot')) {
      return this.get('weather').fetch();
    }
  }
});
```

In this example, the `Route` always returns the article model from the model hook.
The template won't render in the browser or in FastBoot until the article finishes loading.

We detect if the app is running in FastBoot via the call to `this.get('fastboot.isFastBoot')` (and do notice that we've injected the `fastboot` service!).

If we're in FastBoot mode, we add an additional promise to the promise chain in `afterModel()`: we ask the `weather` service for a promise for the weather data.

With this setup, the page in the browser will render as soon as the article has finished loading.
But in FastBoot, we wait until both the article _and_ weather have loaded to send the HTML back to the browser.

### Designing Components

#### Use `didInsertElement` for client-side DOM manipulation

In FastBoot, we do not invoke either `didInsertElement` or `willInsertElement` hooks.
If your components have any direct DOM manipulation you would do it in those hooks.

#### Lifecycle Hooks in FastBoot

FastBoot calls the `init`, `didReceiveAttrs`, `didUpdateAttrs`, and `willDestroy` hooks.
Any code in these hooks will be run inside of FastBoot and should be free of references to browser APIs or DOM manipulation.

### Avoid jQuery

FastBoot relies on [`Ember.ApplicationInstance`](http://emberjs.com/api/classes/Ember.ApplicationInstance.html) to execute your Ember application on the server.
jQuery is [disabled](https://github.com/emberjs/ember.js/blob/v2.7.0/packages/ember-application/lib/system/application-instance.js#L370) by default for these instances because most of jQuery depends on having full DOM access.

### Use `ember-network` for XHR requests

If you are depending on jQuery for XHR requests, use [ember-network](https://github.com/tomdale/ember-network) and replace your `$.ajax` calls with `fetch` calls.

## Troubleshooting in Node

Because your app is now running in Node, not the browser, you will need a new set of tools to help diagnose problems.

### Verbose Logging

Enable verbose logging by running the FastBoot server with the following environment variables set:

```sh
DEBUG=ember-cli-fastboot:* ember fastboot
```

Pull requests for adding or improving logging facilities are very welcome.

### Using Node Inspector with Developer Tools

You can get a debugging environment similar to the Chrome developer tools running with a FastBoot app, although it's not (yet) as easy as in the browser.

First, install the Node Inspector:

```sh
npm install node-inspector -g
```

Next, start the inspector server.
Using the `--no-preload` flag is recommended.
It waits to fetch the source code for a given file until it's actually needed.

```sh
node-inspector --no-preload
```

Once the debug server is running, you'll want to start up the FastBoot server with Node in debug mode.
One thing about debug mode: it makes everything much slower.
Since the `ember fastboot` command does a full build when launched, this becomes agonizingly slow in debug mode.

### Speeding up Server-side Debugging

Avoid the slowness by manually running the build in normal mode, then run FastBoot in debug mode without doing a build:

```sh
ember build && node --debug-brk ./node_modules/.bin/ember fastboot --no-build
```

This does a full rebuild and then starts the FastBoot server in debug mode.

Note that the `--debug-brk` flag will cause your app to start paused to give you a chance to open the debugger.

Once you see the output `debugger listening on port 5858`, visit <http://127.0.0.1:8080/debug?port=5858> in your browser.
Once it loads, click the "Resume script execution" button (it has a ▶︎ icon) to let FastBoot continue loading.

Assuming your app loads without an exception, after a few seconds you will see a message that FastBoot is listening on port 3000\.
Once you see that, you can open a connection.
Any exceptions should be logged in the console, and you can use the tools you'd expect such as `console.log`, `debugger` statements, etc.

## Architecture

### Introduction to Server-Side Rendering

FastBoot implements server-side rendering, which means it runs your JavaScript Ember app on the server so it can send HTML to the user, not an empty white screen while the JavaScript loads.

Server-side rendering, or SSR, is a relatively new idea.
Because it's so new, there are often misconceptions about how it works.
Let's start by defining what SSR is not.

**FastBoot does not replace your existing API server.** Instead, FastBoot drops in on top of your existing API server to improve startup performance and make your Ember app more accessible to user agents without JavaScript.

Perhaps the best way to think about FastBoot is that it is like a browser running in a data center instead of on a user's device.
This browser already has your Ember application loaded and running.

When a request comes in from an end user, the browser in the datacenter is told to visit the same URL.
Because it is already running, there is little startup time.
And because it's in the same datacenter as your API server, network requests are very low latency.
It's like a turbocharged version of the app running in the user's browser.

Once the browser on the server finishes loading the requested URL, we take its DOM, serialize it to HTML, and send it to the user's browser running on their device.
They don't need to download a bunch of JavaScript, wait for it to start up, then wait some more while it makes API requests for the data needed to render.

Instead, the very first thing the user's browser downloads is the rendered HTML.
Only once the HTML and CSS have finished loading does the browser start to download the Ember app's JavaScript.

For users with slow connections or slow devices, this means the very first thing they see is the content they were after.
No more waiting around for multi-hundred-kilobyte payloads to download and parse just to read a blog post.

### Packaging Your App

When you run `ember build` at the command line, Ember compiles your application into the `dist` directory.
That directory contains everything you need to make your application work in the browser.
You can upload it to a static hosting service like S3 or Firebase, where browsers can download and run the JavaScript on the user's device.

FastBoot is a little different because, instead of being purely static, it renders HTML on the server and therefore needs more than just static hosting.
We need to produce a build of the Ember app that's designed to work in Node rather than the browser.

When you run `ember build`, your FastBooted app will produce different artifact sets in `dist/` and `dist/fastboot`.
The artifacts in `dist` are client-side copies of your application that will be sent to all browsers that request your application.
The artifacts in `dist/fastboot` are used by the FastBoot Server to SSR your page.

You can test that the process is working (and that your app is FastBoot-compatible) by running `ember fastboot`, which builds your app then starts up a local server.

Once you've confirmed everything looks good, it's ready to hand off to the FastBoot server running in the production environment.
The good news is that this process is usually handled for you by a deployment plugin for `ember-cli-deploy`; see [Deploying](/docs/deploying) for more information about different deployment strategies.

### The FastBoot Server

The [FastBoot server][fastboot-server] is the heart of the FastBoot architecture.

The server offers an [Express middleware][express] that can be integrated into an existing Node infrastructure, or run standalone.

```javascript
var server = new FastBootServer({
  appFile: appFile,
  vendorFile: vendorFile,
  htmlFile: htmlFile,
  ui: ui
});

var app = express();

app.get('/*', server.middleware());

var listener = app.listen(options.port, function() {
  var host = listener.address().address;
  var port = listener.address().port;

  console.log('FastBoot running at http://' + host + ":" + port);
});
```

## Frequently Asked Questions

_Does this mean I need to rewrite my API server in Ember or JavaScript?_

No.
FastBoot works with your existing API rather than replacing it.
That means you can drop in FastBoot no matter what backend you use, whether it's Node, Rails, PHP, .NET, Java, or any other stack.

That said, the FastBoot server _does_ require Node.
So even though you don't need to replace your backend, you do need to have the ability to deploy Node apps.

_If the app is running in FastBoot and not the user's browser, how do I access things like `localStorage` where I keep authentication tokens?_

The only information about the user requesting the page is any HTTP cookies you have set.
To work with FastBoot, you should store critical information in cookies.

Alternatively, you can store session data for users in stateful persistence on the server, such as a Redis instance.
When the request comes in, you will need to exchange a cookie for the full user session.
We hope that the community can work together to build a robust solution to this scenario.

## Security Issues

If you discover a security vulnerability in FastBoot, we ask that you follow Ember' [responsible disclosure security policy](http://www.emberjs.com/security).

## Useful Links

[ember-cli-deploy]: http://ember-cli-deploy.github.io/ember-cli-deploy/
[ember-cli-document-title]: https://github.com/kimroen/ember-cli-document-title
[ember-cli-head]: https://github.com/ronco/ember-cli-head
[ember-network]: https://github.com/tomdale/ember-network
[express]: http://expressjs.com
[fastboot-server]: https://github.com/ember-fastboot/ember-fastboot-server
[fetch-api]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
