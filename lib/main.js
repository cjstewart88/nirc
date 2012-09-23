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

      // client wanting to send irc command
      client.on('command', function (data) {
				var command = data.substr(1).split(' ');

				// take the common command 'msg` and turn it into a valid irc command
				switch (command[0].toLowerCase()) {
					case "msg":
						var message = command.splice(2,command.length-2).join(' ');
						command[0] = 'privmsg';
						command.push(message);
						ircClient.send.apply(ircClient, command);
						break;
					case "quit":
						ircClient.disconnect(function () {
							client.emit('disconnected');
						});
						
						break;
					default:
						ircClient.send.apply(ircClient, command);
						break;
				}
      });
    });
  });
}