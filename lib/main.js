
module.exports = function (server) {

  var io  = require('socket.io').listen(server),
      irc = require('./irc');

  io.sockets.on('connection', function (client) {
    var ircClient;

    client.on('connect', function (d) {
      // initialize irc connection
      ircClient = new irc.Client({
        server:   d.options.server   || 'irc.freenode.org',
        port:     d.options.port     || 6667,
        password: d.options.password || null,
        username: d.options.username || d.options.nick,
        nick:     d.options.nick     || 'nircUser',
        ssl:      d.options.ssl      || false
      });

      ircClient.connect();

      ircClient.on('message', function(msg) {
        client.emit('message', msg);
      });

    });

    client.on('command', function(d) {
      /* TODO: relay */
    });

    client.on('disconnect', function () {
      ircClient.disconnect();
    });


  });

};
