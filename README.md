[![Build Status](https://travis-ci.org/ember-fastboot/fastboot-website.svg?branch=master)](https://travis-ci.org/ember-fastboot/fastboot-website)

# FastBoot Website-Nice work

This is the Ember.js app that powers the FastBoot website, <https://ember-fastboot.com>.

Most of the content is authored in Markdown and can be found in the `markdown` directory.

## Contributing

You don't need this repository to use FastBoot. However, if you'd like to contribute documentation or correct errors, you can submit a pull request.

To run the website locally:

- `git clone https://github.com/ember-fastboot/fastboot-website`
- `cd fastboot-website`
- `npm install`
- `ember serve`
- Visit the app at <http://localhost:4200>.

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Fastboot Express Server

This site is served in production by an express.js application
[fastboot-server](https://github.com/ember-fastboot/fastboot-website/blob/master/fastboot-server.js). To serve the app using the `fastboot-server` use the following command which will
build the app with production `env` and serve the app at [localhost:3000](http://localhost:300)

```sh
npm run server:node
```

### Deploying

Pull requests merged into master are automatically deployed to Heroku.
