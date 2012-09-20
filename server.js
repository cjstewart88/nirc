var http    = require('http');
var express = require('express');
var irc 		= require('./node-irc/irc');
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
    var opts = {
      debug: true,
			port: 		data.options.port || 6667,
			channels: channels
    };

    if (data.options.password) {
      opts.password = data.options.password;
    }

    if (data.options.ssl) {
      opts.secure      = { rejectUnauthorized: false};
      opts.selfSigned  = true;
      opts.certExpired = true;
    }

		var ircClient = new irc.Client(data.options.server, data.options.nickname, opts);

    // info/err msg listener
    ircClient.addListener('raw', function(message){
      if (message.rawCommand == '331') {
        client.emit('raw', message);
      } else if (message.rawCommand == '332') {
        client.emit('raw', message);
      } else if (message.rawCommand.match(/^\d+$/)) {
        // "Is it numeric" - is this the best characterization of a info/err message?
        // First arg is nick
        client.emit('newInfoMsg', { rawCommand: message.rawCommand, args: message.args.splice(1) } );
      }
    })

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
			client.emit('newChannelMessage', { channel: to, from: from, message: text });
		});

    ircClient.addListener('notice', function(from, to, text, message){
      client.emit('newNotice', { from: from, to: to, message: text });
    });

    // add listener for private messages
    ircClient.addListener('pm', function (from, text, message) {
			client.emit('newPrivateMessage', { from: from, message: text });
		});

		// client wanting to send a message
		client.on('sendMsg', function (data) {
			ircClient.say(data.to, data.message);
		});
    
    // client wanting to use an irc command
    // part and join are the only supported commands
    // that are wired up... 
    client.on('command', function (data) {
      var command = data.split(' ')[0].substr(1).toUpperCase();
      
      var args = data.split(' ');
      args.shift();
      
      switch (command) {
        case "JOIN":
          ircClient.join(args[0]);
          break;
        case "PART":
          ircClient.part(args[0]);
          break;
        default:
          console.log("unknown command");
          //ircClient.send.apply(ircClient, [command].concat(args));
      }
		});
    
		// client disconnected
		client.on('disconnect', function () {
			ircClient.disconnect();
		});
	});
});