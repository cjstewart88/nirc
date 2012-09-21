(function ($) {
  $.nirc = function () {
    var options = {
      server:   $("#server").val(),
      port:     $("#port").val(),
      nickname: $("#nickname").val(),
      channels: $("#channels").val(),
      ssl:      $("#ssl").is(":checked"),
      password: $("#password").val()
    }

    if (options.server == "" || options.nickname == "" || options.channels == "") {
      alert('Fields marked with * are required!');
      return;
    }

    var socket        = io.connect(null);

    var irc           = new ircClient();

    var connectForm   = $('#connect-form');
    var ircStuff      = $('#irc-stuff');
    var tabs          = $('#tabs');
    var tabViews      = $('#tab-views');
    var commandInput  = $('#command-input');

    var newMsg = function (msgData) {
      var msgType = msgData.type;

      var tab     = $('.tab[title="'+msgData.receiver.toLowerCase()+'"]');
      var tabView = $('.tab-view[title="'+tab.attr('title')+'"]');
      var newLine = $('<div>').addClass('line ' + msgType);

      if (!tab.hasClass('active')) {
        tab.addClass('new-msgs');
      }

      if (msgType == 'client') {
        var msgFrom  = $('<span>').addClass('from').text(msgData.from + ': ');
        if (msgData.fromYou) {
          msgFrom.addClass('from-you');
        }

        newLine.append(msgFrom);
      }

      newLine.append(msgData.message);

      tabView.append(newLine)
             .scrollTop(tabView[0].scrollHeight);
    }

    var newTab = function (tabName) {
      $('.tab').removeClass('active');
      $('.tab-view').removeClass('active');

      if ($('.tab[title="'+tabName.toLowerCase()+'"]').length == 0) {
        if (tabName.search(/^[#]/) == 0) {
          newMsg({
            receiver: 'status',
            message:  'joined channel ' + tabName,
            type:     'server'
          });
        }

        var tab = $('<li>').attr('title', tabName.toLowerCase())
                           .addClass('tab active')
                           .text(tabName);

        tab.click(function () {
          $('.tab').removeClass('active');
          $('.tab-view').removeClass('active');

          var tabToActivate   = $(this);
          var tabViewToActive = $('.tab-view[title="'+tabToActivate.attr('title')+'"]');

          activateTab(tabToActivate, tabViewToActive);
        });

        tabs.append(tab);

        var tabView = $('<div>').attr('title', tabName.toLowerCase())
                                .addClass('tab-view active');

        tabViews.append(tabView);
      }
    }

    var closeTab = function (tabName) {
      if (tabName.search(/^[#]/) == 0) {
        newMsg({
          receiver: 'status',
          message:  'parted channel ' + tabName,
          type:     'server'
        });
      }

      var tabNameToClose = tabName.toLowerCase();

      var tab     = $('.tab[title="'+tabNameToClose+'"]');
      var tabView = $('.tab-view[title="'+tabNameToClose+'"]');

      var currentActiveTab  = $('.tab.active').attr('title');
      if (currentActiveTab == tabNameToClose) {
        var tabToActivate     = tab.prev();
        var tabViewToActivate = $('.tab-view[title="'+tabToActivate.attr('title')+'"]');

        activateTab(tabToActivate, tabViewToActivate);
      }

      tab.remove();
      tabView.remove();
    }

    var changeTabWithKeyboard = function (direction) {
      // deactivate old tab
      var currentTab      = $('.tab.active');
      var currentTabView  = $('.tab-view[title="'+currentTab.attr('title')+'"]');

      currentTab.removeClass('active');
      currentTabView.removeClass('active');

      // activate new tab
      var tabToActivate;

      if (direction == 'left') {
        tabToActivate = (currentTab.prev().length == 1 ? currentTab.prev() : $('.tab').last());
      }
      else {
        tabToActivate = (currentTab.next().length == 1 ? currentTab.next() : $('.tab').first());
      }

      var tabViewToActivate = $('.tab-view[title="'+tabToActivate.attr('title')+'"]');

      activateTab(tabToActivate, tabViewToActivate);
    }

    var activateTab = function (tabToActivate, tabViewToActivate) {
      tabToActivate.addClass('active')
                   .removeClass('new-msgs');

      tabViewToActivate.addClass('active')
                       .scrollTop(tabViewToActivate[0].scrollHeight);

      commandInput.focus();
    }

    // START SOCKET LISTENERS
    socket.on('connect', function () {
      socket.emit('connectToIRC', { options: options });

      connectForm.hide();
      ircStuff.show();

      newTab('status');

      newMsg({
        receiver: 'status',
        message:  'connecting...',
        type:     'server'
      });
    });

    socket.on('raw', function(message){
      switch (message.rawCommand.toUpperCase()) {
        case 'KICK':
          irc.getChannel(message.args[0]).removeName(message.args[1]);
          newMsg({
            receiver: message.args[0],
            message: message.args[1] + " was kicked by " + message.prefix.match(/(.*?)(?:!.*?)?$/)[1] + " (" + message.args[2] + ")",
            type: 'server'
          });
          break;
        case 'QUIT':
          var channels = irc.channels();
          for (var key in channels) {
            if (channels[key].removeName(message.nick)) {
              newMsg({
                receiver: channels[key]._name,
                message: message.nick + " has quit (" + message.args[message.args.length - 1] + ")",
                type: 'server'
              })
            }
          }
          break;
        case '331':
          newMsg({
            receiver: message.args[1],
            message: 'No topic for ' + message.args[1],
            type: 'server'
          });
          break;
        case '332':
          newMsg({
            receiver: message.args[1],
            message: 'Topic for ' + message.args[1] + ': "' + message.args[2] + '"',
            type: 'server'
          });
          break;
        case '353':
          irc.getChannel(message.args[2]).populateNames(message.args[3].split(' '));
          newMsg({
            receiver: message.args[2],
            message: "Users in " + message.args[2] + ": " + message.args[3],
            type: 'server'
          });
          break;
        case '366':
          // In large channels, multiple 353s are needed to collect the full list of users.
          // 366 signals that all the 353s are done; the full user list has been received.
          // For now, we'll just print each 353 as it comes and eat the 366, because it's easy.
          break;
        default:
          // unhandled messages here
          if (message.rawCommand.match(/^\d+$/)) {
            newMsg({
              receiver: 'status',
              message: message.args.splice(1).join(' '),
              type: 'server'
            });
          }
      }
    });

    socket.on('newInfoMsg', function(data){
      newMsg({
        receiver: 'status',
        message:  data.args.join(' '),
        type:     'server'
      });
    });

    socket.on('newNotice', function(data){
      newMsg({
        receiver: 'status',
        message:  data.message,
        from:     data.from || options.server,
        type:     'client'
      });
    });

    socket.on('successfullyJoinedChannel', function (data) {
      newTab(data.channel);
      var chan = irc.addChannel(data.channel);
    });

    socket.on('userJoinedChannel', function (data) {
      // this will be used when there's a channel user list
      irc.getChannel(data.channel).addName(data.who);
      newMsg({
        receiver: data.channel,
        message: data.who + " joined " + data.channel,
        type: 'server'
      });
    });

    socket.on('successfullyPartedChannel', function (data) {
      closeTab(data.channel);
    });

    socket.on('userPartedChannel', function (data) {
      // this will be used when there's a channel user list
      irc.getChannel(data.channel).removeName(data.who);
      newMsg({
        receiver: data.channel,
        message: data.who + " parted " + data.channel,
        type: 'server'
      });
    });

    socket.on('newChannelMessage', function (data) {
      newMsg({
        receiver: data.channel,
        from:     data.from,
        message:  data.message,
        type:     'client'
      });
    });

    socket.on('newPrivateMessage', function (data) {
      newTab(data.from);

      newMsg({
        receiver: data.from,
        from:     data.from,
        message:  data.message,
        type:     'client'
      });
    });

    socket.on('clientDisconnected', function (data) {
      newMsg({
        receiver: 'status',
        message:  'disconnected...',
        type:     'server'
      });
    });

    socket.on('errorMessage', function(data) {
      newMsg({
        receiver: 'status',
        message:  data.message,
        type: 'error'
      });
    });
    // END SOCKET LISTENERS

    // CAPTURE USER TYPING
    commandInput.keypress(function (e) {
      var code = (e.keyCode ? e.keyCode : e.which);

      if (code == 13) { // user pressed enter
        var input = commandInput.val();

        if (input != '') {
          if (input.search(/^[\/]/) == 0) {
            // user is trying to use irc commands

            // if a user types the command /part be sure to send
            // the currently active channel
            if (input.split(' ')[0].substr(1).toLowerCase() == 'part') {
              var activeTab = $('.tab.active').text();

              if (activeTab == 'status') {
                newMsg({
                  receiver: 'status',
                  message:  'You can not use the /part command on the status window... to part a channel specify the channel to part. EX: /part #ruby',
                  type:     'server'
                });
                commandInput.val('');
                return;
              }
              else {
                input = input + ' ' + activeTab;
              }
            }

            socket.emit('command', input);

            commandInput.val('');
          }
          else {
            // normal message to current tab-view
            var to = $('.tab.active').text();

            if (to == 'status') return;

            socket.emit('sendMsg', {
              to:       to,
              message:  input
            });

            newMsg({
              receiver: to,
              from:     'you',
              fromYou:  true,
              message:  input,
              type:     'client'
            });

            commandInput.val('');
          }
        }
      }
    });
    // END CAPTURE USER TYPING

    // SETUP KEY BINDINGS
    Mousetrap.bind('ctrl+left', function() {
      changeTabWithKeyboard('left');
    });

    Mousetrap.bind('ctrl+right', function() {
      changeTabWithKeyboard('right');
    });
    // END KEY BINDINGS
  };
})(jQuery);

