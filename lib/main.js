module.exports = function (server) {
  var io  = require('socket.io').listen(server),
      irc = require('./irc');

  io.sockets.on('connection', function (client) {
    client.on('connectToIRC', function (data) {
      // initialize irc connection
      var opts = {
        port:         data.options.port || 6667,
        channels:     data.options.channels.replace(" ","").split(","),
        password:     data.options.password || null,
        secure:       data.options.ssl ? { rejectUnauthorized: false } : null,
        selfSigned:   data.options.ssl ? true : null,
        certExpired:  data.options.ssl ? true : null
      };

      var ircClient = new irc.Client(data.options.server, data.options.nickname, opts);
      
      // messages to print in client's ui
      ircClient.addListener('message', function (message) {
        client.emit('message', message);
      });
      
      // join channel listener
      ircClient.addListener('successfullyJoinedChannel', function (channel) {
        client.emit('successfullyJoinedChannel', { channel: channel });
      });

      // part channel listener
      ircClient.addListener('successfullyPartedChannel', function (channel) {
        client.emit('successfullyPartedChannel', { channel: channel });
      });

      // client wanting to send a message
      client.on('sendMsg', function (data) {
        ircClient.say(data.to, data.message);
      });

      // client wanting to use an irc command
      // part and join are the only supported commands
      // that are wired up...
      client.on('command', function (data) {
        var args    = data.split(' ');
        var command = args.shift().substr(1).toUpperCase();

        switch (command) {
          case "JOIN":
            ircClient.join(args[0]);
            break;
          case "PART":
            ircClient.part(args[0]);
            break;
          default:
            console.log("unknown command:", command);
        }
      });

      // client disconnected
      client.on('disconnect', function () {
        ircClient.disconnect();
      });
    });
  });
}