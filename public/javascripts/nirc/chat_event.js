angular.module('nirc')
  .factory('ChatEvent', function() {
    var ChatEvent = function(from, to, text, opts) {
      this.from    = from;
      this.to      = to;
      this.message = text;
      this.opts = opts || {};
      this.timestamp = new Date();
    };

    return ChatEvent;
  });
