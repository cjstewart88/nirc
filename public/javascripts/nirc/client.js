angular.module('nirc')
  .factory('Client', function($rootScope, Channel, User, ChatEvent) {
    var socket = io.connect(null);

    var Client = {
      options: {
        server:   'irc.freenode.org',
        port:      6667,
        nickname: 'nircUser',
        userName: 'Nirc User',
        channels: [],
        ssl: false,
        password: null
      },

      connected: false,
      channels: [],
      statusChannel: new Channel('status'),
      activeChannel: null,
      me: new User(''),

      say: function(text) {
        this.socket.emit('command', text);
      },

      connect: function() {
        opts = angular.copy(this.options);
        opts.channels = this.options.channels.join(', ');

        socket.emit('connectToIRC', { options: opts });
        this.connected = true;
      },

      disconnect: function() {
        this.connected = false;
      },

      setActive: function(channel) {
        this.activeChannel = channel;
      },

      channel: function(name) {
        if (name == 'status') {
          return this.statusChannel;
        }

        return _.find(this.channels, function(ch) {
          return ch.name == name;
        });
      }

    };

    Client.activeChannel = Client.statusChannel;

    socket.on('message', function(d) {
      var event = new ChatEvent(d.from, d.receiver, d.message);
      var ch;
      if ((ch = Client.channel(event.to))) {
        ch.addEvent(event);
        console.log(event, 'to', ch);
      } else {
        console.log("couldn't find", event.to);
      }
      $rootScope.$apply();
    });

    socket.on('successfullyJoinedChannel', function(d) {
      Client.channels.push(new Channel(d.channel));
      $rootScope.$apply();
    });

    socket.on('successfullyPartedChannel', function (d) {
      _.reject(this.channels, function(ch) {
        return ch.name == d.channel;
      });
      $rootScope.$apply();
    });

    socket.on('realNick', function(d) {
      Client.me = new User(d.nick);
      $rootScope.$apply();
    });

    socket.on('change_nick', function(d) {
      Client.me.rename(d.newnick);
      $rootScope.$apply();
    });


    return Client;

  });
