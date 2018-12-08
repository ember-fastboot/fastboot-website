import $ from 'jquery';
import Component from "@ember/component";

export default Component.extend({
  classNames: 'nav-bar',
  classNameBindings: 'isOffTop',

  didInsertElement() {
    let $window = $(window);

    $window.on('scroll', () => {
      requestAnimationFrame(() => {
        let $section = $('section').first();
        let sectionTop = $section[0].getBoundingClientRect().top;
        this.set('isOffTop', sectionTop < 0);
      });
    });
  }
});
