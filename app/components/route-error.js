import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';

const { computed } = Ember;

export default Ember.Component.extend({
  _parseObj(obj, dir) {
    let prefix = dir || '';
    let result = [];
    let that = this;
    for (let prop in obj) {
      let value = obj[prop];
      if (typeof value === 'object') {
        result.push(that._parseObj(value, prop));
      } else {
        if (prop !== 'intro') {
          result.push(`${prefix}/${prop}`.replace(/^\//, ''));
        }
      }
    }
    return result;
  },
  availablePages: computed(function() {
    return [].concat.apply([], this._parseObj(markdownFiles));
  })
});
