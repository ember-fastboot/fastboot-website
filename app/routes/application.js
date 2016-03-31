import Ember from 'ember';

export default Ember.Route.extend({
  init() {
    if (typeof FastBoot === 'undefined') {
      Ember.$(document).on('click', 'a', function(e) {
        if (!e.ctrlKey && !e.metaKey && e.target.target !== '_blank') {
          let target = e.target || e.currentTarget;
          if (target.host === window.location.host && !target.hash) {
            e.preventDefault();
            if (target.pathname === '/') {
              this.transitionTo('index');
            } else {
              this.transitionTo('doc', target.pathname.replace(/^\//, ''));
            }
          }
        }
      }.bind(this));
    }
  }
});
