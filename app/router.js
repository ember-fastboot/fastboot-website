import Ember from 'ember';
import config from './config/environment';
import injectService from 'ember-service/inject';

const { get, run } = Ember;

const Router = Ember.Router.extend({
  fastboot: injectService(),
  location: config.locationType,
  rootURL: config.rootURL,
  metrics: injectService(),

  didTransition() {
    this._super(...arguments);
    if (!get(this, 'fastboot.isFastBoot')) {
      this._scrollPage();
      this._trackPage();
    }
  },

  _scrollPage() {
    run.scheduleOnce('afterRender', this, () => {
      let position = 0;
      let hash = window.location.hash;
      if (hash) {
        let id = hash.split('#')[1];
        let el = document.getElementById(id);
        if (el) {
          position = el.getBoundingClientRect().top;
        }
      }
      window.scrollTo(0, position);
    });
  },

  _trackPage() {
    run.scheduleOnce('afterRender', this, () => {
      let page = document.location.pathname;
      let title = this.getWithDefault('currentRouteName', 'unknown');

      get(this, 'metrics').trackPage({ page, title });
    });
  }
});

Router.map(function() {
  this.route('page', { path: '*path' });
});

export default Router;
