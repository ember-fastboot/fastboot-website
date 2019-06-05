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
running the FastBoot server with `ember serve` (provided your app is running
`ember-cli` 2.12.0 and above).

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

FastBoot works by running a singular build of your application, leveraging
the common `app.js` and `vendor.js` files in both browser and Node.
However, in Node an additional asset `app-fastboot.js` will also be
leveraged. This asset contains FastBoot specific overrides defined by the
application or other addons.

What this means in practice is that errors will include stack traces
with very large line numbers. The code from your addon will be intermingled
with other addons, and Ember itself, in the `vendor.js` file.

To find the cause of the exception, look at the stack trace shown when
running the app. Note the line number, then open
`dist/assets/vendor.js` in your text editor. Scroll down to the
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
import Component from '@ember/component';
import $ from 'jquery';

let componentsToNotify = [];
$(window).on('resize', () => {
  componentsToNotify.forEach(c => c.windowDidResize());
});

export default Component.extend({
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
import Component from '@ember/component';
import $ from 'jquery';

let componentsToNotify = [];
let didSetupListener = false;

function setupListener() {
  didSetupListener = true;
  $(window).on('resize', () => {
    componentsToNotify.forEach(c => c.windowDidResize());
  });
}

export default Component.extend({
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
Node.js. When you include the library in your `index.js` file, you
include code that will prevent the app from running in FastBoot.

If your addon imports third-party code and you are unable to make
changes to it to add Node compatibility, you can add a guard to your
`index.js` file to only include it in the browser build.

The FastBoot addon (`ember-cli-fastboot`) provides the FastBoot server a manifest of
assets to load in the Node server. If your third-party library is not
Node compatible, you can wrap it with a check as below in an addon:

```js
var map = require('broccoli-stew').map;

treeForVendor(defaultTree) {
  var browserVendorLib = new Funnel(<path to your third party lib>);

  browserVendorLib = map(browserVendorLib, (content) => `if (typeof FastBoot === 'undefined') { ${content} }`);

  return new mergeTrees([defaultTree, browserVendorLib]);
}

included() {
  // this file will be loaded in FastBoot but will not be eval'd
  app.import('vendor/<third party lib file name>.js');
}
```

Note that not running the library in the FastBoot build means that any
modules it exports will not be available inside the app when running in
the FastBoot environment. Make sure to guard against missing
dependencies in that case.

For apps trying to import third party libraries that are not compatible in Node, should
create an in-repo addon within their app and follow the above guideline.

## Loading additional assets in FastBoot

Often your addon may require to load third party libraries that are
specific to Node.js and only need to be loaded on the server side.
This can include loading libraries before or after the vendor file is loaded
in the sandbox and/or before or after the app file is loaded in the sandbox.
Since the FastBoot manifest defines an array of vendor and app files to load
in the sandbox, an addon can define additional vendor/app files to
load in the sandbox as well.

If your addon requires to load something in the sandbox, you can define
the `updateFastBootManifest` hook from your addon (in `index.js`) as an example
below:

```js
included(app) {
  // this will copy contents of foo.js to dist/assets/foo-fastboot.js
  app.import('node_modules/foo-package/dist/foo.js', {
    outputFile: 'assets/foo-fastboot.js'
  });

  // this will copy contents bar.js to dist/assets/bar-fastboot.js
  app.import('node_modules/bar-package/dist/bar.js', {
    outputFile: 'assets/bar-fastboot.js'
  });
},

updateFastBootManifest(manifest) {
  /**
   * manifest is an object containing:
   * {
   *    vendorFiles: [<path of the vendor file to load>, ...],
   *    appFiles: [<path of the app file to load>, ...],
   *    htmlFile: '<path of the base page that should be served by FastBoot>'
   * }
   */

  // This will load the foo.js after vendor.js is loaded in Node
  manifest.vendorFiles.push('assets/foo-fastboot.js');
  // This will load bar.js after app-fastboot.js is loaded in the Node
  manifest.appFiles.push('assets/bar-fastboot.js');

  // remember to return the updated manifest, otherwise your build will fail.
  return manifest;
}
```

The above code snippet loads `foo.js` before `vendor.js` and `bar.js` after
`app-fastboot.js` is loaded in the sandbox. You could chose to decide when you
want to load your library. Typically you would want to load third party libraries
`vendor.js` is loaded in Node. In such cases, you can use
`manifest.vendorFiles.push(...)`.

## Conditionally include assets in FastBoot asset

Often your addon may need to conditionally include additional app trees based on ember version. Example, Ember changed an API and in order to have your addon be backward compatible for the API changes you want to include an asset when the ember version is x. For such usecases you could define the `treeForFastBoot` hook in your addon's `index.js` as below:

```js
treeForFastBoot: function(tree) {
  let fastbootHtmlBarsTree;

  // check the ember version and conditionally patch the DOM api
  if (this._getEmberVersion().lt('2.10.0-alpha.1')) {
    fastbootHtmlBarsTree = this.treeGenerator(path.resolve(__dirname, 'fastboot-app-lt-2-9'));
    return tree ? new MergeTrees([tree, fastbootHtmlBarsTree]) : fastbootHtmlBarsTree;
  }

  return tree;
},
```

The `tree` is the additional fastboot asset that gets generated and contains the fastboot overrides.

## Browser-Only or Node-Only Initializers

If your addon requires browser-specific or Node-specific initialization
code to be run, you would need to define them seperately as follows:

### Browser-Only initializers

You should define an initializer under `app/initializers` or `app/instance-initializers` as normally
you would do. The only addition would to wrap the initializer with a FastBoot environment check. This is
to make sure the initializer does not run in FastBoot. An example is as follows:

```js
function initialize(app) {
  if (typeof FastBoot === 'undefined') {
    // only execute this in browser
  }
}

export default {
  name: 'my-initializer',
  initialize: initializer
}
```

### Node-Only initializer

Often you want to define Node specific behavior for your app at boot time. You should define the Node-Only
initializer under `fastboot/initializers` or `fastboot/instance-initializers`. Note the `fastboot` directory is a sibling of the `app` or `addon` directory. The FastBoot addon (`ember-cli-fastboot`) will read the `fastboot`
directories from all addons and your parent app and create `app-fastboot.js` which is included in the FastBoot manifest and loaded in FastBoot only. As an addon author, you just need to define the initializer
under `fastboot` directory. An example of directory structure is as follows:

```js
-+ app/
----+ initializers/
--------+ foo1.js
--------+  ...
----+ instance-initializers/
--------+ foo.js
--------+  ...
-+ fastboot/
----+ initializers/
--------+ foo-fastboot.js
--------+ bar.js
```

An example of how `bar.js` from the above example will look as:

```js
function initialize(app) {
  // do stuff that will only run in Node
}

export default {
  name: 'bar',
  initialize: initializer
}
```

In the Node only initializer, you don't need to wrap them with any FastBoot check since the above initializer is never
sent to the browser.

**Note**: You could define initializers for browser and Node with the same filename and `name` property. For example, you have an initializer `foo.js` under `app/initializers/foo.js` and `fastboot/initializers/foo.js` with the initializer `name` set to `foo`. When running the app in browser, `app/initializers/foo.js` will run. When running the app in Node, `fastboot/initializers/foo.js` will run.

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
import Service from '@ember/service';
import { computed }  from '@ember/object';
import { getOwner }  from '@ember/application';

export default Service.extend({
  doSomething() {
    let fastboot = this.get('fastboot');
    if (!fastboot) { return; }
    // do something that requires FastBoot
  },

  fastboot: computed(function() {
    let owner = getOwner(this);

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
FastBoot compatible, feel free to join the `#fastboot` channel on the
[Ember Community Discord](https://discordapp.com/invite/zT3asNS)
to get help.
