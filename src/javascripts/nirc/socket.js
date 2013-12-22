angular.module('nirc')
  .factory('Socket', function($rootScope) {
    var Socket = function(addr) {
      this._socket = io.connect(addr);
    };

    Socket.prototype.emit = function(channel, data) {
      return this._socket.emit(channel, data);
    };

    Socket.prototype.on = function(channel, callback) {
      return this._socket.on(channel, function(data) {
        callback(data);
        $rootScope.$apply();
      });
    };

    return Socket;
  });
