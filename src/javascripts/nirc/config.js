/* jshint browser:true */
angular.module('nirc')
  .factory('Config', function($location) {
    var search = $location.search();

    var config = {
      server:   search.server || 'irc.freenode.net',
      port:     search.port ? (Number(search.port) || 6667) : 6667,
      nickname: search.nick   || 'nircUser',
      userName: search.name   || 'Nirc User',
      channels: search.channels || [],
      ssl:      !!search.ssl    || false,
      password: search.password || null,
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

    /* if only a single channel was provided convert to an array */
    if (typeof(config.channels) == 'string') {
      config.channels = [config.channels];
    }

    config.channels = config.channels.map(function(chName) {
      return chName[0] != '#' ? '#' + chName : chName;
    });

    /* only load if no options were passed in as search */
    var anySet = _.any(['server', 'port', 'nick', 'name', 'ssl', 'password', 'channels'],
                       function(k) { return (k in search); });

    if (!anySet) {
      config.load();
    }

    return config;
  });
