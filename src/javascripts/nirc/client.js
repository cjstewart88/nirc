angular.module('nirc')
  .factory('Client', function($rootScope, Channel, User, ChatEvent, Socket) {
    var socket = new Socket(null);

    var Client = {
      connected: false, /* are we currently connected? */
      channels: [],     /* list of channels we're in. */
      statusChannel: new Channel('status'), /* psuedo-channel for displaying
                                             * content that doesn't belong in a
                                             * regular channel */
      activeChannel: null, /* the currently selected channel */
      me: new User(''),    /* our user information. */

      /* -- public interface below -- */

      say: function(text) {
        var ch = this.activeChannel;

        if (!text || !text.length) {
          return;
        }

        if (text.charAt(0) != '/') {
          /* add our own text to the channel. */
          ch.addEvent(new ChatEvent(this.me, new User(ch.name), text));
          text = '/msg ' + ch.name + ' ' + text;
        }

        socket.emit('command', text);
      },

      connect: function(options) {
        opts = angular.copy(options);
        opts.channels = options.channels.join(', ');

        socket.emit('connectToIRC', { options: opts });
        this.connected = true;
      },

      disconnect: function() {
        this.connected = false;
        this.channels = [];
        this.activeChannel = this.statusChannel;
      },

      /* set the active channel to the provided channel object. */
      setActive: function(channel) {
        this.activeChannel.activity = false;
        this.activeChannel = channel;
        this.activeChannel.activity = false;
      },

      /* move back one channel */
      previousChannel: function() {
        if (!this.channels.length) { return; }
        var index = _.indexOf(this.channels, this.activeChannel);
        switch(index) {
        case -1:
          this.setActive(_.last(this.channels));
          break;
        case 0:
          this.setActive(this.statusChannel);
          break;
        default:
          this.setActive(this.channels[index - 1]);
          break;
        }
      },

      /* move forward one channel */
      nextChannel: function() {
        if (!this.channels.length) { return; }
        var index = _.indexOf(this.channels, this.activeChannel);
        switch(index) {
        case -1:
          this.setActive(this.channels[0]);
          break;
        case this.channels.length-1:
          this.setActive(this.statusChannel);
          break;
        default:
          this.setActive(this.channels[index + 1]);
          break;
        }
      },

      /* leave a channel */
      part: function(channel) {
        this.say("/part " + channel.name);
      },

      /* remove channel from Client.channels */
      removeChannel: function(channelName) {
        if (channelName == this.activeChannel.name) {
          this.previousChannel();
        }

        this.channels = _.reject(this.channels, function(ch) {
          return ch.name == channelName;
        });
      },

      /* find a channel, given a name. returns undefined if not found. */
      channel: function(name) {
        if (name == 'status') {
          return this.statusChannel;
        }
        return _.find(this.channels, function(ch) { return ch.name == name; });
      },

      addEvent: function(event) {
        var ch;

        if (event.to.nick == this.me.nick) {
          ch = this.statusChannel;
        } else if (!(ch = this.channel(event.to.nick))) {
          ch = new Channel(event.to.nick);
          this.channels.push(ch);
        }

        ch.addEvent(event);

        if (ch !== this.statusChannel && this.me.mentionedIn(event.message)) {
          event.mention = true;
          $rootScope.$broadcast('mention', {
            channel: ch,
            event: event,
            user: this.me
          });
        }
      }
    };

    /* Initially our active channel is the status pane. */
    Client.activeChannel = Client.statusChannel;

    /* handle private events from the socket.io connector */
    socket.on('message', function(d) {
      var event = new ChatEvent(
            new User(d.from || ''),
            new User(d.receiver),
            d.message
          );

      Client.addEvent(event);
    });

    socket.on('successfullyJoinedChannel', function(d) {
      Client.channels.push(new Channel(d.channel));
    });

    socket.on('successfullyPartedChannel', function(d) {
      Client.removeChannel(d.channel);
    });

    socket.on('realNick', function(d) {
      Client.me = new User(d.nick);
    });

    socket.on('change_nick', function(d) {
      Client.me.rename(d.newnick);
    });

    socket.on('channel_add_nicks', function(d) {
      var ch;
      if ((ch = Client.channel(d.channel))) {
        _.each(d.nicks, function(u) { ch.addUser(new User(u)); });
      }
    });

    socket.on('channel_remove_nick', function(d) {
      var ch;
      if ((ch = Client.channel(d.channel))) {
        ch.users = _.reject(ch.users, function(u) {
          return u.nick == d.nick;
        });
      }
    });

    return Client;
  });
