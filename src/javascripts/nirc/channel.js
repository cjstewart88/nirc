angular.module('nirc')
  .factory('Channel', function() {

    var Channel = function(name, opts) {
      opts = opts || {};

      this.name  = name;
      this.mode  = opts.mode;
      this.topic = opts.topic;
      this.history = [];
      this.users   = [];

      this.activity = false;
    };

    Channel.MAX_HISTORY = 500;

    Channel.prototype.addEvent = function(event) {
      this.history.push(event);
      this.activity = true;

      while (this.history.length > Channel.MAX_HISTORY) {
        this.history.shift();
      }
    };

    Channel.prototype.addUser = function(user) {
      this.users.push(user);
    };

    return Channel;
  });
