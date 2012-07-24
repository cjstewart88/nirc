var express = require('express');
var irc 		= require('irc');
var io      = require('socket.io');

var server  = express.createServer();
var port    = process.env.PORT || 3000;

server.configure(function() {
  server.set('view engine', 'html');
  server.set('views', __dirname + '/views');
  server.set('view options', {layout: false});
  server.register('.html', {
    compile: function(str, options){
      return function(locals){
        return str;
      };
    }
  });
  server.use(express.static(__dirname + '/public'));
});

// routes
server.get('/', function(req, res) {
  res.render('index');
});

server.listen(port);

var io = io.listen(server);

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (client) {	
	client.on('connectToIRC', function (data) {
		var channels = data.options.channels.replace(" ","").split(",");
		
		// initialize irc connection
		var ircClient = new irc.Client(data.options.server, data.options.nickname, {
			port: 		data.options.port || 6667,
			channels: channels
		});
		
		// listener for every channel
		for (var i = 0; i < channels.length; ++i) {
			ircClient.addListener('message'+channels[i], function (channel, from, message) {
				client.emit('newMessage', { channel: channel, from: from, message: message });
			});
		}

		 // clients wanting to send a message
		client.on('sendMsg', function (data) {
			ircClient.say(data.channel, data.message);
		});

		// client disconnected
		client.on('disconnect', function () {
			ircClient.disconnect();
		});
	});
});