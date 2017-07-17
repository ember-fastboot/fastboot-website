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

The best way to get help is via the [Ember Community Slack](https://ember-community-slackin.herokuapp.com/). Once you've signed up, join the [#-fastboot](https://embercommunity.slack.com/archives/-fastboot) channel.

### The Road to FastBoot 1.0

FastBoot is currently pre-1.0 software and under active development. You can track progress to FastBoot 1.0 by visiting the [Road to 1.0](https://github.com/ember-fastboot/ember-cli-fastboot/issues/396) GitHub issue.

If you wish to contribute and help in shipping FastBoot 1.0, please help us in with fixing addons listed in this [issue](https://github.com/ember-fastboot/ember-cli-fastboot/issues/387).
