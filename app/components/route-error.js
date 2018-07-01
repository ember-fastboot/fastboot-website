import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';

const { computed } = Ember;
const excludedPages = ['intro'];

export default Ember.Component.extend({
  _parsePages(obj, prefix) {
  	return Object.keys(obj).map(key => {
  		const value = obj[key];
  		if (typeof value === 'object') {
  			return this._parsePages(value, key);
  		}
  		return prefix ? `${prefix}/${key}` : key;
  	})
  	.reject(p => excludedPages.includes(p))
  	.reverse();
  },
  availablePages: computed(function() {
    return [].concat.apply([], this._parsePages(markdownFiles));
  })
});
