var http    = require('http')
var express = require('express');
var irc 		= require('irc');
var io      = require('socket.io');

var app     = express().engine('html', require('ejs').renderFile)
                       .set('view engine', 'html')
                       .set('views', __dirname + '/views')
                       .use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.render('index');
});

var server  = http.createServer(app)
                  .listen(process.env.PORT || 3000);

var io      = io.listen(server);

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
			ircClient.addListener('message'+channels[i], function (from, text, message) {
				client.emit('newMessage', { channel: message.args[0], from: from, message: text });
			});
		}

		// clients wanting to send a message
		client.on('sendMsg', function (data) {
			ircClient.say(data.to, data.message);
		});

		// client disconnected
		client.on('disconnect', function () {
			ircClient.disconnect();
		});
	});
});