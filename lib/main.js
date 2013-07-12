module.exports = function (server) {
	var io = require('socket.io').listen(server),
	irc = require('irc');

	io.sockets.on('connection', function (client) {
		client.on('connectToIRC', function (data) {
			// initialize irc connection
			var opts = {
				port : data.options.port || 6667,
				channels : data.options.channels.replace(" ", "").split(","),
				password : data.options.password || null,
				userName : data.options.userName || data.options.nickname,
				secure : data.options.ssl ? {
					rejectUnauthorized : false
				}
				 : null,
				selfSigned : data.options.ssl ? true : null,
				certExpired : data.options.ssl ? true : null
			};

			var ircClient = new irc.Client(data.options.server, data.options.nickname, opts);
			//---------------------------Client-Listeners-------------------------
			client.on('message', function (channel, message) {
				ircClient.say(channel, message);
				console.log(channel + ' ' + message);
			});

			/*client.on('part', function (channel) {
				ircClient.part(channel);
			});

			client.on('quit', function (message, reason) {
				ircClient.disconnect(message, reason);
			});*/

			client.on('command', function (target, type, text) {
				if (type == '/me') {
					ircClient.say(target, '\u0001ACTION ' + text + '\u0001');
				}
			});
			//--------------------------IRC-Listeners-----------------------------
			ircClient.addListener('registered', function (message) {
				client.emit('serverMsg', message);
				var nick = message.args[0];
					client.emit('realNick', {
						nick : nick
					});
				opts.nickName = message.args[0];
			});

			ircClient.addListener('raw', function (message) {
				client.emit('serverMsg', message);
			});

			ircClient.addListener('names', function (channel, nicks) {
				client.emit('channel_add_nicks', channel, nicks);
			});

			/*ircClient.addListener('topic', function (channel, topic, nick, message) {
				//client.emit('topic', channel, topic, nick, message);
			});*/

			ircClient.addListener('join', function (channel, nick, message) {
				if (message.nick === opts.nickName) {
					client.emit('successfullyJoinedChannel', {
					channel : channel
				});

				} else {
					//client.emit('notice', channel, nick, message);
					client.emit('channel_joins', channel, nick);
				}
			});

			ircClient.addListener('message', function (nick, channel, text) {
				var command = false;
				client.emit('message', nick, channel, text, command);
			});

			ircClient.addListener('ctcp', function (from, to, text, type) {
				var command = false;
				var splitInput = text.split(' ');
				var checkCommand = splitInput[0];
				if (checkCommand === 'ACTION') {
					command = true;
				}
				var newText = text.substring(text.indexOf(" ") + 1, text.length);
				client.emit('message', from, to, newText, command);
			});

			ircClient.addListener('pm', function (from, message) {
				client.emit('pm', from, message);
				console.log(from, message);
			});

			ircClient.addListener('quit', function (nick, reason, channels, message) {
				client.emit('channel_remove_nick', nick, channels);
				//client.emit('notice', nick, reason, channels, message);
			});

			/*ircClient.addListener('kick', function (channel, nick, by, reason, message) {
				//client.emit('notice', channel, nick, by, reason, message);
			});*

			/*ircClient.addListener('kill', function (nick, reason, channels, message) {
				client.emit('notice', nick, reason, channels, message');
			});*/

			ircClient.addListener('part', function (channels, nick, reason, message) {
				//client.emit('notice', channels, nick, reason, message);

				if (nick === opts.nickName) {
					client.emit('successfullyPartedChannel', {
						channel : channels
					});
				}
				client.emit('channel_remove_nick', nick, channels);
			});

			ircClient.addListener('nick', function (oldnick, newnick, channels, message) {
				//client.emit('notice', oldnick, newnick, channels, message);
				client.emit('change_nick', channels, oldnick, newnick);
			});

			/*ircClient.addListener('error', function (message) {
			
			});*/

			/*ircClient.addListener('irc_error', function (message) {
				if (message.command == 'KICK' && message.args[1] == opts.nickName) {
					client.emit('serverMsg2', message.nick + ' Kicked ' + message.args[1] + ' from ' + message.args[0]);
					client.emit('kicked', message.args[0], message.args[1]);
				} else if (message.command == 'KICK' && message.args[1] !== opts.nickName) {
					client.emit('serverMsg2', message.nick + ' Kicked ' + message.args[1] + ' from ' + message.args[0]);
				}
			});*/
			
			//------------------------IRC-listeners-end-------------------------------
			// messages to print in client's ui
			ircClient.addListener('message', function (message) {
				client.emit('message', message);
			});

			// client wanting to send irc command
			client.on('disconnect', function (data) {
				ircClient.disconnect("disconnected", "Quit");
			});
		});
	});
};
