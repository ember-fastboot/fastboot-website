import Ember from 'ember';
import markdownFiles from 'ember-fr-markdown-file/markdownFiles';
import injectService from 'ember-service/inject';

const { $, get } = Ember;

export default Ember.Route.extend({
  fastboot: injectService(),

  init() {
    if (!get(this, 'fastboot.isFastBoot')) {
      $(document).on('click', 'a', function(e) {
        let target = e.currentTarget;
        let $target = $(target);
        let targetHost = target.host === '' ? window.location.host : target.host;

        let isMailto = (target.href && target.href.indexOf('mailto:') > -1);
        let shouldHandleClick = (e.which === 1 && !e.ctrlKey && !e.metaKey && target.target !== '_blank');

        if (shouldHandleClick && !isMailto) {
          if ($target.hasClass('link-to')) {
            e.preventDefault();
            return;
          }
          if (targetHost === window.location.host) {
            let [,path] = target.href.split(target.host);
            console.log(target.hash);
            if (!target.hash) {
              e.preventDefault();
              this.transitionTo(path);
              return;
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
