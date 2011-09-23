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

/*    SOCKET.IO SHIT    */
var io = io.listen(server);

// handler for when a new client connects
io.sockets.on('connection', function (client) {	
	var channel = null;
	
	client.on('connectToIRC', function (data) {
		channel = data.options.channel;
		
		// initialize irc connection
		var ircClient = new irc.Client(data.options.server, data.options.nickname, {
			port: 		data.options.port || 6667,
			channels: [channel]
		});

		// new message from channel
		ircClient.addListener('message'+channel, function (from, message) {
			client.emit('newMessage', { from: from, message: message });
		});
		
		 // clients wanting to send a message
		client.on('sendMsg', function (data) {
			ircClient.say(channel, data.message);
		});
	});
  
  // client disconnected
  client.on('disconnect', function () {
		delete ircClient;
  });
});
