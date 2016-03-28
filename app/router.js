import Ember from 'ember';
import config from './config/environment';

const Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('quickstart');
  this.route('best-practices');
  this.route('cli-reference');
  this.route('architecture');
  this.route('philosophy');
  this.route('deploying');
  
  this.route('doc', { path: '*path' });
});

export default Router;
