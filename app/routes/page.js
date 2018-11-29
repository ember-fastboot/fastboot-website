import Route from '@ember/routing/route';
import { get } from '@ember/object';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';

export default Route.extend({
  model(params) {
    const path = params.path;
    return {markdown: get(markdownFiles, path.replace(/\//g, '.')) || null, path};
  },
});
