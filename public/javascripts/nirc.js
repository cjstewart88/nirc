angular.module('nirc', [])
  .factory('User', function() {
    var User = function(nick) {
      var parts;

      this.whole = nick;
      /* is it in the format user!~login@host? */
      if ((parts = nick.match(User.REGEXP))) {
        this.nick     = parts[1];
        this.login    = parts[2];
        this.hostname = parts[3];
      } else {
        /* probably just a plain nick */
        this.nick = nick;
      }
    };

    /* $1 = nick, $2 = login, $3 = hostname */
    User.REGEXP = /^([^!]+)!([^@]+)@(.+)$/;

    return User;
  })

  .factory('Channel', function() {

    var Channel = function(name, opts) {
      opts = opts || {};

      this.name  = name;
      this.mode  = opts.mode;
      this.topic = opts.topic;

      this.history = [];
      this.users   = [];
    };

    Channel.MAX_HISTORY = 500;

    Channel.prototype.addLine = function(line) {
      this.history.push(line);

      while (this.history.length > Channel.MAX_HISTORY) {
        this.history.shift();
      }
    };

    return Channel;
  })

  .factory('ChatEvent', function() {
    var ChatEvent = function(user, text, opts) {
      this.user = user;
      this.text = text;
      this.opts = opts;
    };

    return ChatEvent;
  })

  .controller('MainCtrl', function($scope, Channel, User, ChatEvent) {
    $scope.channels = [];
    $scope.activeChannel = null;

    $scope.channels.push(new Channel('#nirc'));
    $scope.channels.push(new Channel('#ruby'));
    $scope.channels.push(new Channel('#node'));


    $scope.setActive = function(ch) {
      $scope.activeChannel = ch;
    };

  })

  .controller('TabCtrl', function($scope) {

    $scope.isActive = function(ch) {
      return $scope.activeChannel === ch;
    };

  });
