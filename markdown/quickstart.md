# FastBoot Quickstart

## Creating a New Ember App

This quickstart guide will walk you through creating a simple Ember app that fetches data from GitHub, then renders it using FastBoot.

To start, make sure you've got Node.js and npm installed. If you've never used Ember before, you may want to run through the [Ember quickstart guide](https://guides.emberjs.com/v2.7.0/getting-started/quick-start/).

Install Ember by running:

```sh
npm install ember-cli -g
```

Create a new application by running:

```sh
ember new github-fastboot-example
```

Once created, `cd` into the `github-fastboot-example` directory.

We need to fetch data from the GitHub API, but there's a small problem: the browser uses `XMLHttpRequest` to fetch JSON data, while in Node.js you'd use the `http` library. We'll be running the same Ember.js app in both environments, so we need some way of making it work in both.

Let's install a tool that will let us write the same code whether our app is running in the browser or on the server. Code that runs in both places is sometimes called _universal_ or _isomorphic_.

Run the following command to install `ember-fetch`:

```sh
ember install ember-fetch
```

Under the hood, the `ember install` command is just like `npm install`, but automatically saves the addon to your `package.json` file.

## Rendering the Model

In Ember, routes are objects responsible for fetching model data. Let's make a route that fetches information about you from GitHub.

Run the following command in your terminal:

```sh
ember generate route index
```

This will generate a new route called `index`. By convention, `index` is the name of the route for when the user visits the root path, or `/`. Think of it like `index.html`.

Open the newly-created `app/routes/index.js` file in your code editor. Let's add a method called `model()` to the route that fetches information about your user from GitHub.

We'll use the `fetch` polyfill exposed by the `ember-fetch` addon that lets us write universal fetching code for both the browser and Node.js. A _polyfill_ is a library that provides a standardized API that isn't available in all environments yet. In this case, it's polyfilling the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

Implement the model hook like I did below. You might want to change the username in the URL from mine to yours.

```javascript
import Ember from 'ember';
import fetch from 'ember-fetch/ajax';

export default Ember.Route.extend({
  model() {
    return fetch('https://api.github.com/users/tomdale')
      .then(function(response) {
        return response;
      });
  }
});
```

Next, let's render that model in the `index` template. Open `app/templates/index.hbs` and type the following Handlebars template:

```hbs
<p>
  Username: {{model.login}}
</p>
<p>
  Avatar: <img src={{model.avatar_url}} width="32" height="32">
</p>
<p>
  # of Public Repos: {{model.public_repos}}
</p>
```

Once you've made those changes (don't forget to save!), switch back to the terminal and run the development server:

```sh
ember serve
```

This runs a local development server you can use to verify your program is running correctly. Visit [localhost:4200/](http://localhost:4200/) in your browser. You should see your GitHub profile rendered below a title that says "Welcome to Ember.js".

![Screenshot of completed app](/images/quickstart/github-fastboot-example-screenshot.png)

We've verified we've got a working application, but there's one problem. If you use your browser's View Source feature, you'll see that there's no HTML being rendered: just an empty body and some `<script>` tags. Let's fix that.

![Screenshot showing that the HTML does not contain the application contents](/images/quickstart/github-fastboot-example-empty-source.png)

## Install FastBoot

Back in the terminal, stop the development server by hitting `Ctrl-C` on your keyboard.

Next, install FastBoot:

```sh
ember install ember-cli-fastboot
```

Let's turn on server-side rendering and make sure it works. Start the FastBoot server like this if you have `ember-cli` 2.12.0 and above in your app:

```sh
ember serve
```

*Note*: `ember fastboot` command is soon going to be deprecated and removed in FastBoot 1.0. Please refrain from using it as it has live-reload and other issues

View the FastBoot-rendered content by visiting [localhost:4200/](http://localhost:4200/). Note the same port! `ember serve` can serve render your app on server side as well. Moreover, all options of `ember serve` will work with FastBoot (example `--proxy`, `--port` etc).

Everything should look just the same as before. The only difference is that, this time when you View Source, the `<body>` tag is populated with the rendered HTML content.

![Screenshot showing that application content is now rendered as HTML](/images/quickstart/github-fastboot-example-populated-source.png)

Congratulations! You've just built your first FastBoot application.

Let's review what we've accomplished here:

1. We created a new app in one command with `ember new`
2. We used the universal library `ember-fetch` to request AJAX data
3. When rendering in Node.js, the FastBoot server requested data from GitHub _on the user's behalf_
4. We wrote an app that has the benefits of traditional server-side rendering **and** the benefits of client-side JavaScript, in a single codebase. No hacks, just installing an addon.

Now that you've got your first FastBoot app, it's time to start adding FastBoot to your existing apps. Or, learn how to deploy your new app by learning about [Deploying](/docs/deploying).

### Disabling FastBoot with `ember serve`

If your app is running ember-cli 2.12.0-beta.1 and above, you can now serve your FastBoot rendered content with `ember serve` as well.

In order to serve the CSS, JavaScript, images in addition to rendering the server side content, just run:

```sh
ember serve
```

View the FastBoot-rendered by visiting [localhost:4200](http://localhost:42000/). You can alternatively also use the following curl command: `curl 'http://localhost:4200/' -H 'Accept: text/html'`.

You can also turn off the server side rendering on a per request basis using `fastboot` query parameter. To disable FastBoot rendered content, visit [localhost:4200/?fastboot=false](http://localhost:4200/?fastboot=false). You can enable FastBoot rendered content again by visiting [localhost:4200/?fastboot=true](http://localhost:4200/?fastboot=true).
