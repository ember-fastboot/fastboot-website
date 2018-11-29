### How Does It Work?

FastBoot works by running your Ember application in Node.js. When a user visits your site, the initial HTML is rendered and served to the user. The very first thing they see is your content.

Only after the content has loaded do they start downloading JavaScript. Once finished, your app takes over. You get the same snappy performance you're used to from Ember apps.

And yes, this means the content in your Ember application is accessible to everyone, even if they have JavaScript turned off. It's even accessible to cURL—try it yourself:

```sh
curl 'http://localhost:4200/' -H 'Accept: text/html'
```

For more information, see [the User Guide](/docs/user-guide)

### Running FastBoot

To start the FastBoot server during development:

```sh
ember serve
```

For more information, see the [Quickstart](/quickstart).

### Get Help & Contribute

The FastBoot source code is [available on GitHub](https://github.com/tildeio/ember-cli-fastboot). If you run into an error, please [file an issue](https://github.com/emberjs/ember.js/issues)

The best way to get help is via the [Ember Community Discord](https://discordapp.com/invite/zT3asNS). Once you've signed up, join the `#fastboot` channel.
