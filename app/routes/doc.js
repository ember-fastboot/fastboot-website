/* global FastBoot */
import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';

const { get } = Ember;

export default Ember.Route.extend({
  afterModel: function() {
    this._super(...arguments);
    if (typeof FastBoot === 'undefined') {
      window.scrollTo(0, 0);
    }
  },
  model(params) {
    return get(markdownFiles, params.path.replace(/\//g, '.'));
  }
});
