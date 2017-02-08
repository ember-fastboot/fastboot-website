import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';
const { get } = Ember;

export default Ember.Route.extend({
  model() {
    return get(markdownFiles, 'intro');
  }
});
