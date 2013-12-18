angular.module('nirc')
  .factory('ChatEvent', function() {
    var ChatEvent = function(user, text, opts) {
      this.user = user;
      this.text = text;
      this.opts = opts;
    };

    return ChatEvent;
  });
