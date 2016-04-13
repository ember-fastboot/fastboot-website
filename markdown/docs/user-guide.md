# User Guide

## Introduction

FastBoot brings server-side rendering to Ember.js applications. By
performing initial renders on the server, your Ember app is accessible
to search engines, `curl`, and other scrapers. Users see content faster,
and can view your app even if they have JavaScript disabled or
the JavaScript files fail to load.

## Installation

FastBoot is an addon you can add to existing Ember CLI apps. To
FastBoot-enable your application, run:

```sh
ember install ember-cli-fastboot
```

This will install the `ember-cli-fastboot` addon via npm and save it to
your application's `package.json`.

## Testing Locally

You can start a FastBoot server on your development machine by running:

```sh
ember fastboot
```

This starts a FastBoot server listening on port 3000. You can verify
it's working by curling from `localhost`:

```sh
curl http://localhost:3000
```

To stop the server, press `Ctrl-C` on your keyboard to kill the process.

Note that, at the moment, the server does not automatically restart when
you make changes. If you make changes to your application, you'll need
to kill the server and restart it.

You can run the development server on a different port by passing the
`--port` argument:

```sh
ember fastboot --port 4567
```

## Building for Production

Once you've installed the FastBoot addon, a Node.js-compatible build of
your app is automatically included when you run `ember build`. As with
any other Ember build, you'll want to build for the production
environment when deploying for your users to use:

```sh
ember build --environment production
```

**You are strongly encouraged to automate deploys using [Ember CLI
Deploy][ember-cli-deploy].** There are a number of FastBoot-compatible
deploy plugins, with more being authored every day.

[ember-cli-deploy]: http://ember-cli.com/ember-cli-deploy/

Manual deployment is slow and error-prone, and even if you have a custom
deployment process, writing an Ember CLI Deploy plugin is
straightforward and will save you time and energy in the future.

As with a standard Ember build for the browser, compiled assets by
default go in your application's `dist` directory. FastBoot adds two
additions:

1. `dist/package.json`, which contains metadata about your app for
   consumption by the FastBoot server.
2. `dist/fastboot/`, which contains your app's compiled JavaScript that
   is evaluated and run by the FastBoot server.

For more information, see the [Architecture](#architecture) section.

## How To...

### Fetch Resources Over HTTP (AJAX)

JavaScript running in the browser relies on the `XMLHttpRequest`
interface to retrieve resources, while Node.js offers the `http` module.
What do we do if we want to write a single app that can fetch data from
our API server when running in both environments?

One option is to use the [ember-network][ember-network] addon, which
provides an implementation of [Fetch API][fetch-api] standard that works
seamlessly in both environments.

[ember-network]: https://github.com/tomdale/ember-network
[fetch-api]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

To use `ember-network`, install it as you would any addon:

```sh
ember install ember-network
```

Once installed, you can import it using the JavaScript module syntax,
wherever you need to make a network request:

```js
import fetch from 'ember-network/fetch';
```

The `fetch()` method returns a promise and is very similar to jQuery's
`getJSON()` method that you are likely already using. For example,
here's an Ember route that uses `fetch()` to access the GitHub JSON API
and use it as the route's model:

```js
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

For more information, see [ember-network][ember-network] and the [Fetch
documentation on MDN][fetch-api].

### Specify the Page Title

To control the title that gets displayed for a route (i.e., the
`<title>` tag), install the FastBoot-compatible
`ember-cli-document-title` addon:

```sh
ember install ember-cli-document-title
```

This addon allows you to specify the page title by adding a `title`
property to your application's routes.

```js
// routes/post.js
export default Ember.Route.extend({
  titleToken: function(model) {
    return model.get('name');
  }
});
```

See [ember-cli-document-title][ember-cli-document-title] for more
information.

[ember-cli-document-title]: https://github.com/kimroen/ember-cli-document-title

### Enable Open Graph, Twitter Cards and Other `<head>` Tags

FastBoot makes your Ember application accessible to services that embed
content, such as Twitter's cards and Facebook posts. You can customize
how your site appears in these contexts with `<meta>` tags driven
dynamically by your Ember app.

To get started, install the `ember-cli-head` addon:

```sh
ember install ember-cli-head
```

The `ember-cli-head` addon works by giving you a Handlebars template
that is rendered into your application's `<head>` tag. To configure what
gets rendered, edit the newly-created `app/templates/head.hbs` file.

For example, to set the title used when embedding a route in Facebook
(or any other Open Graph-compatible app), add the appropriate `<meta>`
tag to `head.hbs`:

```hbs
{{!-- app/templates/head.hbs --}}
<meta property="og:title" content={{model.title}} />
```

This creates a `<meta>` tag whose `property` attribute is `og:title`.
Now we just need to tell it what the title is, which is typically
determined dynamically by the current route's model:

```js
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

For more information, see [ember-cli-head][ember-cli-head].

[ember-cli-head]: https://github.com/ronco/ember-cli-head

### Access Request Headers

When your app is running in Node.js, you can access the headers for the
current HTTP request via the FastBoot service's `headers` property.

You can inject the FastBoot service by importing `ember-service/inject`,
or use `Ember.inject.service` if you are using globals:

```js
import Component from 'ember-component';
import injectService from 'ember-service/inject';

export default Component.extend({
  fastboot: injectService()
});

// ...or...

export default Ember.Component.extend({
  fastboot: Ember.inject.service()
});
```

The FastBoot service has a `headers` property, which is a key/value hash
of all of the HTTP headers associated with the current request. Header
names are lowercased, so `CONTENT-TYPE`, `Content-Type` or
`ConTEnT-TypE` would all appear in the `headers` hash as `content-type`.

Here's an example of a route that logs the `X-Request-ID` header for the current
request, if it exists:

```js
import Route from 'ember-route';
import injectService from 'ember-service/inject';

export default Route.extend({
  fastboot: injectService(),

  beforeModel() {
    let fastboot = this.get('fastboot');
    let requestID = fastboot.get('headers.x-request-id');

    if (requestID) {
      console.log(`Handling ${requestID}`);
    }
  }
});
```

### Access Cookies

You can access the cookies for the current request via the FastBoot
service's `cookies` property. Like `headers`, this is a key/value hash
of cookie names and values. (Note that unlike `headers`, cookie names
are not normalized to lowercase.)

Here's an example of using a cookie from the user's browser as an auth
token when talking to an API server, allowing us to "impersonate" the
user.

```js
import Route from 'ember-route';
import fetch from 'ember-network/fetch';
import injectService from 'ember-service/inject';

export default Route.extend({
  fastboot: injectService(),

  model(params) {
    let authToken = this.get('fastboot.cookies.auth');
    let options = {
      headers: {
        'X-Auth-Token': authToken
      }
    };

    return fetch(`http://api.example.com/users/${params.user_id}`, options)
      .then(r => r.json());
  }
});
```

In order to access cookies in a way that works both in the browser as well as
in the FastBoot server, use
[ember-cookies](https://github.com/simplabs/ember-cookies) and the `cookies`
service it exposes:

```js
import Route from 'ember-route';
import fetch from 'ember-network/fetch';
import injectService from 'ember-service/inject';

export default Route.extend({
  fastboot: injectService(),
  cookies: injectService(),

  model(params) {
    let authToken = this.get('cookies').read('auth');
    let options = {
      headers: {
        'X-Auth-Token': authToken
      }
    };

    return fetch(`http://api.example.com/users/${params.user_id}`, options)
      .then(r => r.json());
  }
});
```

### Check the Current Host

You can access the hostname of the current FastBoot server via the
`fastboot` service. The `host` property will include the protocol and
the host (e.g. `https://example.com`).

```js
export default Ember.Route.extend({
  fastboot: Ember.inject.service(),

  model() {
    let host = this.get('fastboot.host');
    // ...
  }
});
```

**Warning**: The host is supplied by the user, is easily spoofed, and
should not be trusted. To retrieve the host of the current request, you
must specify a list of hosts that you expect by adding a `hostWhitelist`
configuration in your app's `config/environment.js` file:

```js
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

The `hostWhitelist` can be a string or RegExp to match multiple hosts.
Care should be taken when using a RegExp, as the host function relies on
the `Host` HTTP header, which is easily forged. You could potentially
allow a malicious request if your RegExp is too permissive when using
the `host` when making subsequent requests.

Retrieving `host` will error on 2 conditions:

 1. You do not have a `hostWhitelist` defined.
 2. The `Host` header does not match an entry in your `hostWhitelist`

### Using Node.js Dependencies

The browser and Node.js are two different environments, and
functionality in one is not always available in the other. As you
develop your app, you may need to pull in additional dependencies
to provide for functionality not available by default in Node.

For example, `localStorage` is not available in Node.js and you may
instead want to save information to a Redis server by using the `radredis`
npm packge.

For security reasons, your Ember app running in FastBoot can only access
packages (both built-in and from npm) that you have explicitly
whitelisted.

To allow your app to require a package, add it to the
`fastbootDependencies` array in your app's `package.json`:

```js
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

The `fastbootDependencies` in the above example means the only modules
your Ember app can use are `radredis` (provided from npm) and `path` (a
built-in Node module).

If the package you are using is not built in to Node, **you must also
specify the package and a version in the `package.json` `dependencies`
hash.** Built-in modules (`path`, `fs`, etc.) only need to be added to
`fastbootDependencies`.

From your Ember.js app, you can run `FastBoot.require()` to require a
package. This is identical to the CommonJS `require` except it checks
all requests against the whitelist first.

```js
if (typeof FastBoot !== 'undefined') {
  let path = FastBoot.require('path');
  let filePath = path.join('tmp', session.getID());
}
```

If you attempt to require a package that is not in the whitelist,
FastBoot will raise an exception.

Note that the `FastBoot` global is **only** available when running in
FastBoot mode. You should either guard against its presence or only use
it in FastBoot-only initializers.

### Defer Rendering of Async Components

An Ember.js app running in the browser is long-lived: as soon as the
page loads, you can start rendering parts of the UI as soon as the data
driving that UI becomes available.

Ember starts by collecting the models for each route on screen (via
`Route`'s `model()`, `beforeModel()`, and `afterModel()` hooks). If any
of your routes return a promise from one of these hooks, Ember will wait
until those promises resolve before rendering the templates. This avoids
a jarring "pop-in" effect.

Sometimes, though, you don't want secondary UI to block the main
content. For example, imagine an app for managing contacts. It shows
information for one contact, as well as a list of all contacts in the
sidebar.

You may not want to wait for the entire list of contacts to load before
showing the primary information the user is after: details about a
specific contact. So, once the `model()` hook finishes loading for the
route, the template is rendered, and the sidebar shows a loading spinner
while the full list is loaded.

<img src="images/contacts-example.png" width="991">

In the browser, the router's promise chain controls when the template is
rendered. But you can always render immediately (by not returning a
promise) and have each component on the page update onces its backing
data becomes available.

FastBoot is different. Because it's sending a static page of HTML to the
user's browser, it needs to know when the page is "done." As soon as
FastBoot thinks the page is done rendering, it converts the DOM into
HTML, sends it to the browser, and destroys the application instance.

Like when deciding when to render a route's templates, FastBoot uses the
promise chain built by routes' `beforeModel()`, `model()`, and
`afterModel()` hooks. But if some components are responsible for
marshalling their own data, they may render too late for the HTML
response and the user (or the search crawler!) may see the loading state
instead of the content you intended.

To work around this, you can add additional promises to the
`afterModel()` hook when in FastBoot mode that block rendering until all
of the data is loaded. Use services to coordinate between the route and
the components on the page.

For example, let's imagine we're building a news page that also has a
weather widget. In the browser, we load the primary model (the article)
in the `model()` hook. The weather component fetches data from a
`weather` service.

In the browser, we let the weather component render a loading spinner if
the article loads before the weather data. But in FastBoot, we block
rendering until the weather data is available.

Here's what the `Route` for that page might look like:

```js
// app/routes/article.js
import Route from 'ember-route';
import injectService from 'ember-service/inject';

export default Route.extend({
  fastboot: injectService(),
  weather: injectService(),

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

In this example, the `Route` always returns the article model from the
model hook. The template won't render in the browser or in FastBoot
until the article finishes loading.

We detect if the app is running in FastBoot via the call to
`this.get('fastboot.isFastBoot')` (and do notice that we've injected the
`fastboot` service!).

If we're in FastBoot mode, we add an additional promise to the promise
chain in `afterModel()`: we ask the `weather` service for a promise for
the weather data.

With this setup, the page in the browser will render as soon as the
article has finished loading. But in FastBoot, we wait until both the
article _and_ weather have loaded to send the HTML back to the browser.

## Architecture

### Introduction to Server-Side Rendering

FastBoot implements server-side rendering, which means it runs your
JavaScript Ember app on the server so it can send HTML to the user, not an
empty white screen while the JavaScript loads.

Server-side rendering, or SSR, is a relatively new idea. Because it's so
new, there are often misconceptions about how it works. Let's start by
defining what SSR is not.

**FastBoot does not replace your existing API server.**
Instead, FastBoot drops in on top of your existing API server to
improve startup performance and make your Ember app more accessible
to user agents without JavaScript.

Perhaps the best way to think about FastBoot is that it is like a
browser running in a data center instead of on a user's device. This
browser already has your Ember application loaded and running.

When a request comes in from an end user, the browser in the datacenter is
told to visit the same URL. Because it is already running, there is little
startup time. And because it's in the same datacenter as your API server,
network requests are very low latency. It's like a turbocharged version of the
app running in the user's browser.

Once the browser on the server finishes loading the requested URL, we take
its DOM, serialize it to HTML, and send it to the user's browser running on
their device. They don't need to download a bunch of JavaScript, wait for it
to start up, then wait some more while it makes API requests for the data
needed to render.

Instead, the very first thing the user's browser downloads is the rendered
HTML.  Only once the HTML and CSS have finished loading does the browser
start to download the Ember app's JavaScript.

For users with slow connections or slow devices, this means the very first
thing they see is the content they were after. No more waiting around for
multi-hundred-kilobyte payloads to download and parse just to read a blog
post.

### Packaging Your App

When you run `ember build` at the command line, Ember compiles
your application into the `dist` directory. That directory
contains everything you need to make your application work in the browser.
You can upload it to a static hosting service like S3 or Firebase, where
browsers can download and run the JavaScript on the user's device.

FastBoot is a little different because, instead of being purely static, it
renders HTML on the server and therefore needs more than just static hosting.
We need to produce a build of the Ember app that's designed to work in
Node.js rather than the browser.

One of our goals is to one day produce a "universal" build of an Ember app
that runs in both environments, to make release tracking easier. But for
right now, you will need to manage two builds.

That's just what the `ember fastboot:build` command does. It
creates a compiled version of your application with browser-specific code
stripped out (and sometimes Node-specific code added) and puts it in the
`fastboot-dist` directory.

You can test that the process is working (and that your app is
FastBoot-compatible) by running `ember fastboot`, which builds your app
then starts up a local server.

Once you've confirmed everything looks good, it's ready to hand off to
the FastBoot server running in the production environment. The good news
is that this process is usually handled for you by a deployment plugin
for `ember-cli-deploy`; see [Deploying](/docs/deploying) for more
information about different deployment strategies.

### The FastBoot Server

The [FastBoot server][fastboot-server] is the heart of the FastBoot
architecture. The server offers an [Express middleware][express] that
can be integrated into an existing Node.js infrastructure, or run
standalone.

[fastboot-server]: https://github.com/ember-fastboot/ember-fastboot-server
[express]: http://expressjs.com

```js
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

*Does this mean I need to rewrite my API server in Ember or JavaScript?*

No. FastBoot works with your existing API rather than replacing it. That means
you can drop in FastBoot no matter what backend you use, whether it's Node.js,
Rails, PHP, .NET, Java, or any other stack.

That said, the FastBoot server _does_ require Node.js. So even though
you don't need to replace your backend, you do need to have the ability to
deploy Node.js apps.

*If the app is running in FastBoot and not the user's browser, how
do I access things like `localStorage` where I keep
authentication tokens?*

The only information about the user requesting the page is any HTTP cookies you
have set. To work with FastBoot, you should store critical information in
cookies.

Alternatively, you can store session data for users in stateful persistence
on the server, such as a Redis instance. When the request comes in, you will
need to exchange a cookie for the full user session. We hope that the community
can work together to build a robust solution to this scenario.

## Security Issues

If you discover a security vulnerability in FastBoot, we ask that you
follow Ember.js' [responsible disclosure security
policy](http://www.emberjs.com/security).
