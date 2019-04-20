[![Build Status](https://travis-ci.org/ember-fastboot/fastboot-website.svg?branch=master)](https://travis-ci.org/ember-fastboot/fastboot-website)

# FastBoot Website

This is the Ember.js app that powers the FastBoot website, <https://ember-fastboot.com>.

Most of the content is authored in Markdown and can be found in the `markdown` directory.

## Contributing

You don't need this repository to use FastBoot. However, if you'd like to contribute documentation or correct errors, you can submit a pull request.

To run the website locally:

- `git clone https://github.com/ember-fastboot/fastboot-website`
- `cd fastboot-website`
- `npm install`
- `ember serve`
- Visit the app at <http://localhost:3000>.

### Running Tests

* `ember test`
* `ember test --server`

### Building

* `ember build` (development)
* `ember build --environment production` (production)

### Deploying

Pull requests merged into master are automatically deployed to Heroku via Travis.
