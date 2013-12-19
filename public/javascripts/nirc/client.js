angular.module('nirc')
  .factory('Client', function($rootScope, Channel, User, ChatEvent) {
    var socket = io.connect(null);

    var Client = {
      /* these are the connection params we'lluse when connect() is called. */
      options: {
        server:   'irc.freenode.org',
        port:     6667,
        nickname: 'nircUser',
        userName: 'Nirc User',
        channels: [],
        ssl:      false,
        password: null
      },

      connected: false, /* are we currently connected? */
      channels: [],     /* list of channels we're in. */
      statusChannel: new Channel('status'), /* psuedo-channel for displaying
                                             * content that doesn't belong in a
                                             * regular channel */
      activeChannel: null, /* the currently selected channel */
      me: new User(''),    /* our user information. */

      /* -- public interface below -- */

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

      /* set the active channel to the provided channel object. */
      setActive: function(channel) {
        this.activeChannel = channel;
      },

      /* find a channel, given a name. returns undefined if not found. */
      channel: function(name) {
        if (name == 'status') {
          return this.statusChannel;
        }
        return _.find(this.channels, function(ch) { return ch.name == name; });
      }
    };

    /* initially our active channel is the status pane. */
    Client.activeChannel = Client.statusChannel;

    /* handle private events from the socket.io connector */
    socket.on('message', function(d) {
      var ch, event = new ChatEvent(new User(d.from || ''), new User(d.receiver), d.message);

      if ((ch = Client.channel(event.to.nick))) {
        ch.addEvent(event);
      } else {
        console.log("couldn't find", event.to.nick);
        /* perhaps here we spawn a new channel ? */
      }

      $rootScope.$apply();
    });

    socket.on('successfullyJoinedChannel', function(d) {
      Client.channels.push(new Channel(d.channel));
      $rootScope.$apply();
    });

    socket.on('successfullyPartedChannel', function (d) {
      Client.channels = _.reject(Client.channels, function(ch) {
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

    socket.on('channel_add_nicks', function(d) {
      var ch;
      if ((ch = Client.channel(d.channel))) {
        _.each(d.nicks, function(u) {
          console.log(u);
          ch.addUser(new User(u));
        });
      }
      $rootScope.$apply();
    });

    socket.on('channel_remove_nick', function(d) {
      var ch;
      if ((ch = Client.channel(d.channel))) {
        ch.users = _.reject(ch.users, function(u) {
          return u.nick == d.nick;
        });
      }
      $rootScope.$apply();
    });

    return Client;
  });
