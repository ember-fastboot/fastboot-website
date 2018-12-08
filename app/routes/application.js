import Route from '@ember/routing/route';
import { get } from '@ember/object';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';

export default Route.extend({
  model() {
    return get(markdownFiles, 'intro');
  }
});
