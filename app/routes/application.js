import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';
import injectService from 'ember-service/inject';

const { get } = Ember;

export default Ember.Route.extend({
  fastboot: injectService(),

  init() {
    if (!get(this, 'fastboot.isFastBoot')) {
      Ember.$(document).on('click', 'a', function(e) {
        if (!e.ctrlKey && !e.metaKey && e.target.target !== '_blank') {
          let target = e.target || e.currentTarget;
          if (target.host === window.location.host && !target.hash) {
            e.preventDefault();
            if (target.pathname === '/') {
              this.transitionTo('index');
            } else {
              this.transitionTo('page', target.pathname.replace(/^\//, ''));
            }
          }
        }
      }.bind(this));
    }
  },
  model() {
    return get(markdownFiles, 'intro');
  }
});
