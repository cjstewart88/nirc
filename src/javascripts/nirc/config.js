/* jshint browser:true */
angular.module('nirc')
  .factory('Config', function() {

    var config = {
      server:   'irc.freenode.net',
      port:     6667,
      nickname: 'nircUser',
      userName: 'Nirc User',
      channels: [],
      ssl:      false,
      password: null,
      load: function() {}, /* nop */
      save: function() {}  /* nop */
    };

    if ('localStorage' in window) {
      config.save = function() {
        localStorage.setItem('nirc:config', JSON.stringify(this));
      };

      config.load = function() {
        var saved = JSON.parse(localStorage.getItem('nirc:config') || '{}');
        angular.extend(this, saved);
      };
    }

    config.load();

    return config;
  });
