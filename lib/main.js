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

      ircClient.addListener('raw', function (message) {
        // eventually, everything should be in here, not just numerics
        if (message.rawCommand.match(/^\d+$/)) {
          client.emit('raw', message);
        }
      });

      // join channel listener
      ircClient.addListener('join', function (channel, nick, args) {
        var actionToEmit = (nick == ircClient.nick ? 'successfullyJoinedChannel' : 'userJoinedChannel')
        client.emit(actionToEmit, { channel: channel, who: nick });
      });

      // part channel listener
      ircClient.addListener('part', function (channel, nick, message, args) {
        var actionToEmit = (nick == ircClient.nick ? 'successfullyPartedChannel' : 'userPartedChannel')
        client.emit(actionToEmit, { channel: channel, who: nick });
      });

      // listener for normal messages
      ircClient.addListener('message', function (from, to, text, message) {
        client.emit('message', { channel: to, from: from, message: text });
      });

      // listener for notices
      ircClient.addListener('notice', function (from, to, text, message){
        client.emit('newNotice', { from: from, to: to, message: text });
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
            client.emit('errorMessage', {message: "Unknown command: " + command});
            //ircClient.send.apply(ircClient, [command].concat(args));
        }
      });

      // client disconnected
      client.on('disconnect', function () {
        ircClient.disconnect();
      });
    });
  });
}