import Ember from "ember";
import Component from "ember-component";

export default Component.extend({
  classNames: 'nav-bar',
  classNameBindings: 'isOffTop',

  didInsertElement() {
    let $window = Ember.$(window);

    $window.on('scroll', () => {
      requestAnimationFrame(() => {
        let $section = Ember.$('section').first();
        let sectionTop = $section[0].getBoundingClientRect().top;
        this.set('isOffTop', sectionTop < 0);
      });
    });
  }
});
