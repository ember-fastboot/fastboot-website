# Addon Author Guide

If you're the author of an Ember addon, you might need to make some
changes to ensure that your addon runs correctly in the FastBoot
environment.

Remember that when updating your addons for FastBoot compatibility, your
code now must run in both a browser *and* Node.js. Most importantly,
that means that you cannot assume that DOM APIs will always be
available.

## Don't Break the Boot

The first step towards FastBoot support is ensuring that your addon
doesn't cause the app to crash when it is run in Node. You can verify this by
adding your addon to a new Ember app, adding the FastBoot addon, and
running the FastBoot server with `ember fastboot`.

If that process results in an error and the server crashing, you know
that your addon is trying to do something that may work in the browser
but not in Node.js.

### Common Causes

The most common cause of failure on boot is initialization code that
relies on the following global objects that aren't available in Node.js:

* `document`
* `navigator`
* `window`

For example, many addons may detect features by creating an element via
`document.createElement()` and checking whether certain properties on it
exist. Or an addon may try to detect the height of the viewport via
`window.innerHeight`, but because there is no viewport conceptually in
Node, this value is not set.

### Tracking It Down

FastBoot works by turning an Ember application and all of its
dependencies, including your addon, into a single bundle of JavaScript.
Similar to how you ship an `app.js` and `vendor.js` file to the browser
when you deploy an Ember app, the FastBoot server also loads these two
files.

What this means in practice is that errors will include stack traces
with very large line numbers. The code from your addon will be intermingled
with other addons, and Ember itself, in the `vendor.js` file.

To find the cause of the exception, look at the stack trace shown when
running the app. Note the line number, then open
`dist/fastboot/vendor.js` in your text editor. Scroll down to the
provided line number (or, better, use your editor's "Go to Line"
functionality) to pinpoint exactly which line is causing the issue.

![Example error message and stack trace from an incompatible addon](/images/addon-author-guide/stack-trace-example.png)

### How to Fix It

There are two common approaches to fixing code that accesses browser
APIs.

First, you can check for the existence of the API you need before
accessing it. For example, imagine we have an addon that checks the user
agent of the browser to detect the platform. That code looks something
like this:

```js
var ua = window.navigator.userAgent || '';
```

This line will throw an exception, because `window.navigator` doesn't
exist in Node. Instead, we can add an extra guard to verify it exists,
and default to an empty string if not:

```js
var ua = window && window.navigator ? window.navigator.userAgent : '';
```

The second option is to move any code that relies on browser-only APIs to
hooks that only get invoked in the browser.

Independent from FastBoot compatibility, it's generally a good idea to
do as little work as possible during the evaluation of your addon's
JavaScript files. Doing upfront work can have a negative impact on load
times. If you can defer doing work (such as feature detection) until the
last possible moment, you can improve the performance of applications
using your addon. Adding FastBoot compatibility is a good opportunity to
make these improvements to your addon.

Here's a concrete example. Imagine our addon has a component that needs
to listen to `resize` events on the window. We set up a single listener in
our component file that's shared across all instances of the component:

```js
// addon/components/resizable-component.js
import Ember from "ember";
import $ from "jquery";

let componentsToNotify = [];
$(window).on('resize', () => {
  componentsToNotify.forEach(c => c.windowDidResize());
});

export default Ember.Component.extend({
  init() {
    componentsToNotify.push(this);
  },

  windowDidResize() {
    // ... do some work
  },

  willDestroy() {
    for (let i = 0; i < componentsToNotify.length; i++) {
      if (componentsToNotify[i] === this) {
        componentsToNotify.splice(i, 1);
        break;
      }
    }
  }
});
```

In this approach, we set up an event listener on the window even if the
app author never uses our component. It also means that our addon won't
work in FastBoot, because it tries to access the DOM while defining the
component.

Instead, we can move this setup into the component's
`didInsertElement()` hook, which is only invoked once the component is
inserted into the DOM (i.e., it's only invoked in the browser
and never in Node).

```js
// addon/components/resizable-component.js
import Ember from "ember";
import $ from "jquery";

let componentsToNotify = [];
let didSetupListener = false;

function setupListener() {
  didSetupListener = true;
  $(window).on('resize', () => {
    componentsToNotify.forEach(c => c.windowDidResize());
  });
}

export default Ember.Component.extend({
  didInsertElement() {
    if (!didSetupListener) { setupListener(); }
    componentsToNotify.push(this);
  },

  windowDidResize() {
    // ... do some work
  },

  willDestroy() {
    for (let i = 0; i < componentsToNotify.length; i++) {
      if (componentsToNotify[i] === this) {
        componentsToNotify.splice(i, 1);
        break;
      }
    }
  }
});
```

This lazy approach moves setup to the first time the component is used,
improving boot time for routes in the application that don't use this
component. It also means the component is FastBoot-compatible, because
all of the code that touches the DOM is contained in the
`didInsertElement()` hook, which is not invoked in FastBoot.

### Third-Party Dependencies

Many Ember addons wrap other JavaScript libraries in a way that makes
them easier to use from an Ember app. For example, the
[ivy-codemirror](https://github.com/IvyApp/ivy-codemirror) addon wraps
the [CodeMirror code editor](https://codemirror.net/) in a component
that makes it easy to drop into an Ember app.

Sometimes the library your addon wraps is itself incompatible with
Node.js. When you include the library in your `ember-cli-build.js` file,
you include code that will prevent the app from running in FastBoot.

If your addon imports third-party code and you are unable to make
changes to it to add Node compatibility, you can add a guard to your
`ember-cli-build.js` file to only include it in the browser build.

The FastBoot addon sets the `EMBER_CLI_FASTBOOT` environment variable
when it is building the FastBoot version of the application. Use
this to prevent the inclusion of a library in the FastBoot build:

```js
if (!process.env.EMBER_CLI_FASTBOOT) {
  // This will only be included in the browser build
  app.import('some/jquery.plugin.js')
}
```

Note that not including the library in the FastBoot build means that any
modules it exports will not be available inside the app when running in
the FastBoot environment. Make sure to guard against missing
dependencies in that case.

## Browser-Only or Node-Only Initializers

If your addon requires browser-specific or Node-specific initialization
code to be run, consider using the
[fastboot-filter-initializers](https://github.com/ronco/fastboot-filter-initializers)
Broccoli plugin. This allows you to define target-specific
initializers just by putting them in the right directory.

For example, to write an instance initializer that only runs in the
FastBoot environment, you'd simply put it in
`app/instance-initializers/fastboot`.

## Requiring Node Modules

Some addons may need functionality when running in FastBoot that is
normally provided by the browser. Addons can load Node modules (either
built-in or from npm) when running in FastBoot, but only if they've been
explicitly whitelisted first.

To whitelist a dependency, you'll need to edit your addon's
`package.json`. You probably already have an `ember-addon` field there.
Edit this this hash to add a property called `fastbootDependencies` that
contains an array of Node modules that may be used.

Make sure that any modules you want to access are also included in your
`package.json`'s `dependencies` field.

For example, if I have an addon where I need to use both the built-in
`path` module as well as `redis`, my `package.json` might look like
this:

```js
{
  "name": "my-ember-addon",
  "version": "1.0.0",
  // ...
  "dependencies": {
    "redis": "^2.6.0"
  },
  "ember-addon": {
    "configPath": "tests/dummy/config",
    "fastbootDependencies": [
      "path",
      "redis"
    ]
  }
}
```

Because `path` is built-in, I don't need to add it to my dependencies.
But because `redis` comes from npm, I need to add it as a dependency. In
both cases, I must explicitly whitelist that both are available to the
Ember app.

Now that we've configured `path` and `redis` to be available from
within our Ember app, addon code can require it using the
`FastBoot.require()` method:

```js
const redis = FastBoot.require('redis');

let client = redis.createClient();
```

Note that the `FastBoot` global is _only_ available when running in
FastBoot and won't exist when your app is running in the browser. If you
have some code that runs in both environments, make sure to check
whether `FastBoot` exists before you access it. (And, of course, someone
may be using your addon in an app that doesn't have FastBoot installed.)

## Accessing the FastBoot Service

As discussed in the [User Guide](user-guide), you can access information
about the current request via the `fastboot` service, accessible like
any other service in an Ember app.

One thing to note is that someone may use your addon in an app that
doesn't have FastBoot installed. In that case, if your addon tries to
inject the `fastboot` service, they'll get an exception saying the
`fastboot` service cannot be found.

Instead, you can write a computed property that uses the low-level
`getOwner` functionality to lookup the `fastboot` service directly:

```js
import Ember from "ember";

export default Ember.Service.extend({
  doSomething() {
    let fastboot = this.get('fastboot');
    if (!fastboot) { return; }
    // do something that requires FastBoot
  },

  fastboot: Ember.computed(function() {
    let owner = Ember.getOwner(this);

    return owner.lookup('service:fastboot');
  })
});
```

## Examples

It can be helpful to look at examples of other real-world addons that
have made tweaks for FastBoot compatibility. Here is a list of pull
requests to various addons that have fixed FastBoot compatibility
issues:

* [Fix IE check on FastBoot -
  ember-power-select](https://github.com/cibernox/ember-power-select/pull/543)
* [Make it Fastboot compatible -
  ember-basic-dropdown](https://github.com/cibernox/ember-basic-dropdown/pull/42/files)
* [Lazy Fastboot compatibility -
  ivy-codemirror](https://github.com/IvyApp/ivy-codemirror/pull/18)
* [Fastboot compatibility -
  ember-cli-head](https://github.com/ronco/ember-cli-head/pull/1)
* [Fastboot compatibility -
  ember-gestures](https://github.com/runspired/ember-gestures/pull/56)
* [Fastboot compatibility - ember-wormhole](https://github.com/yapplabs/ember-wormhole/pull/54)

## Getting Help

If you're still having trouble figuring out how to make your addon
FastBoot compatible, feel free to join the `#-fastboot` channel on the
[Ember Community Slack](https://ember-community-slackin.herokuapp.com/)
to get help.
