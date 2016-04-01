/* global FastBoot */
import Ember from 'ember';
import config from './config/environment';
import injectService from 'ember-service/inject';

const { get, run } = Ember;

const Router = Ember.Router.extend({
  location: config.locationType,
  metrics: injectService(),

  didTransition() {
    this._super(...arguments);
    if (typeof FastBoot === 'undefined') {
      window.scrollTo(0, 0);
      this._trackPage();
    }
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
  this.route('doc', { path: '*path' });
});

export default Router;
