import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';

const { get } = Ember;

export default Ember.Route.extend({
  model(params) {
    return get(markdownFiles, params.path.replace(/\//g, '.')) || null;
  }
});
