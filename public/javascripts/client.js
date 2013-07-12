(function ($) {
  $.nirc = function (socket) {
    var options = {
      server:   $("#server").val(),
      port:     $("#port").val(),
      nickname: $("#nickname").val(),
      userName: $("#user").val(),
      channels: $("#channels").val(),
      ssl:      $("#ssl").is(":checked"),
      password: $("#password").val()
    }

    if (options.server == "" || options.nickname == "" || options.channels == "") {
      alert('Fields marked with * are required!');
      return;
    }
    else if (typeof(Storage) !== "undefined" && localStorage) {
      //store the options in localStorage
      var opts = $.extend({}, options); //copy to modify
      delete opts['password']; //except password, probably a bad idea
      localStorage.ircOptions = JSON.stringify(opts);
    }

    var connectForm   = $('#connect-form');
    var ircStuff      = $('#irc-stuff');
    var tabs          = $('#tabs');
    var tabViews      = $('#tab-views');
    var tabView       = $('#tab-view');
    var textInput	  = $('#command-input');
	var thisChannel;
    var supportsNotifications = !!window.webkitNotifications;
	
	//-----------------------Messages--------------------------
    var getTabView = function(title) {
	  return $('.tab-view[title="'+title+'"]');
    };

    var newMsg = function (msgData) {
		var tab = $('.tab-view[title="' + msgData.channel + '"]');
		var newLine = $('<div>').addClass('line');
		var msg;
			
		if (msgData.command === true){
		msg = $('<i>').addClass('message').text(msgData.from + ' ' + msgData.message);
		}
		else {
		msg = $('<span>').addClass('message').text(msgData.from + ': ' + msgData.message);
		}
			
		var timestamp = $("<span>").addClass('timestamp').text(new Date().toString().split(' ')[4]);
		
		var mentionRegex = new RegExp("(^|[^a-zA-Z0-9\\[\\]{}\\^`|])" + options.nickname + "([^a-zA-Z0-9\\[\\]{}\\^`|]|$)", 'i');
		var containsMention = msgData.message.toString().match(mentionRegex);
		if (containsMention) {
			newLine.append(timestamp);
			newLine.append(': ');
			newLine.append(msg).addClass('mentioned');
			tab.append(newLine);
		} else {
			newLine.append(timestamp);
			newLine.append(': ');
			newLine.append(msg);
			tab.append(newLine);
		}
    }

    var newNotification = function (msg, title, icon) {
      var authorized = supportsNotifications && window.webkitNotifications.checkPermission() == 0;
      if (authorized) {
        return window.webkitNotifications.createNotification(icon,title,msg);
      }
    }

    /* this function works as both:
     * focusTab("#target-tab") ... or focusTab($("#target-tab"))
     *
     * AND as a callback function (assuming click object is the tab being clicked)
     * jqueryObject.click(focusTab);
     */
    var focusTab = function (target) {
      $('.tab').removeClass('active');
      $('.tab-view').removeClass('active');

      var tabToActivate;

      if(typeof(target) == 'string') { //assumed selector string
        tabToActivate = $(target);
      }
      else if (target instanceof jQuery) { //they've passed what we need
        tabToActivate = target;
      }
      else { //assume we're in a callback
        tabToActivate = $(this);
		thisChannel = tabToActivate.attr('title').toLowerCase();
      }

      var tabViewToActivate = $('.tab-view[title="'+tabToActivate.attr('title')+'"]');

      tabToActivate.addClass('active').removeClass('new-msgs');
      tabViewToActivate.addClass('active').scrollTop(tabViewToActivate[0].scrollHeight);
      textInput.focus();
    }

    var newTab = function (tabName) {
		thisChannel = tabName.toLowerCase();
		
      if ($('.tab[title="'+tabName.toLowerCase()+'"]').length == 0) {
        $('.tab').removeClass('active');
        $('.tab-view').removeClass('active');

        var tab = $('<li>').attr('title', tabName.toLowerCase())
                           .addClass('tab active')
                           .text(tabName);

        if (tabName != 'status') {
          var closeButton = $('<span>').addClass('close-tab')
                                       .text('[x]')
                                       .click(closeTabFromXButton);

          tab.append(closeButton);
        }

        tab.click(focusTab);

        tabs.append(tab);

        var tabView = $('<div>').attr('title', tabName.toLowerCase())
                                .addClass('tab-view active');

        if (tabName.split('')[0] == '#') {
          var nickList = $('<ul>').addClass('nicklist');
          tabView.append(nickList);
        }
        else {
          tabView.addClass('no-nicklist');
        }

        tabViews.append(tabView);
        textInput.focus();
      }
      else {
        focusTab($('.tab[title="'+tabName.toLowerCase()+'"]'));
      }
    }

    var closeTabFromXButton = function (e) {
      e.stopImmediatePropagation();

      var tabToClose = $(this).parent().attr('title');

      if (tabToClose.indexOf('#') == 0) {
        socket.emit('command', '/part ' + tabToClose);
      }
      else {
        closeTab(tabToClose);
      }
    };

    var closeTab = function (tabName) {
      var tabNameToClose = tabName.toLowerCase();

      var tab     = $('.tab[title="'+tabNameToClose+'"]');
      var tabView = $('.tab-view[title="'+tabNameToClose+'"]');

      var currentActiveTab  = $('.tab.active').attr('title');
      if (currentActiveTab == tabNameToClose) {
        focusTab(tab.prev());
      }

      tab.remove();
      tabView.remove();
    };

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

      focusTab(tabToActivate);
    };

    var removeNickFromList = function(channel, nick) {
      var tabView = getTabView(channel);
      var nickList = tabView.find('.nicklist');

      $.each(nickList.children(), function (i, e) {
        if ($(e).text() == nick) {
          $(e).remove();
        }
      });
    };

    var addNickToList = function(channel, nick) {
      var tabView = getTabView(channel);
      var nickList = tabView.find('.nicklist');

      var nickIsInList = false;
      $.each(nickList.children(), function (i, e) {
        if ($(e).text() == nick) { nickIsInList = true; }
      });

      if (!nickIsInList) {
        var nickLi = $('<li>').text(nick).click(function () {
          newTab($(this).text());
        });

        var insertBeforeItem = nickList.children('li').filter(function(i){
          return $(this).text().toLowerCase() > nick.toLowerCase();
        }).first();

        if (insertBeforeItem.length > 0) {
          nickLi.insertBefore(insertBeforeItem);
        } else {
          nickList.append(nickLi);
        }
      }
    };

		// INITIALIZE IRC CONNECTION
		socket.emit('connectToIRC', { options: options });

		connectForm.hide();
		ircStuff.show();
    document.title = 'nirc - ' + options.server;

		newTab('status');
		// END INITIALIZATION OF IRC CONNECTION

    // START SOCKET LISTENERS
    socket.on('successfullyJoinedChannel', function (data) {
      newTab(data.channel);
    });

    socket.on('channel_add_nicks', function(channel, nicks){
      $.each(nicks, function (key, value) {
        addNickToList(channel, key + value);
      });
    });
	
    socket.on('channel_joins', function(channel, nick){
        addNickToList(channel, nick);
    });

    socket.on('channel_remove_nick', function(nick, channel){
		console.log('channel_remove_nick: ' + channel + ' ' + nick);
		removeNickFromList(nick, channel);
    });

    socket.on('change_nick', function(channels, oldnick, newnick){
      removeNickFromList(channels, oldnick);
      addNickToList(channels, newnick);
    });

    socket.on('successfullyPartedChannel', function (data) {
      closeTab(data.channel);
    });
	
    socket.on('notice', function (data) {
		//option to turn notice on/off later
		//Shows kick, kills, nickchange and more
    });

		//-----------------server-messages----------------------------
		socket.on('serverMsg', function (message) {
			//Array
			var msgData = {
				from : server,
				channel : "status",
				message : message.args
			};
			newMsg(msgData);
		});
		socket.on('serverMsg2', function (message) {
			//No array. Plain text
			var msgData = {
				from : server,
				channel : "status",
				message : message
			};
			newMsg(msgData);		
		});
		//--------------------user-messages-----------------------------
		socket.on('message', function (nick, channel, text, command) {
		if (command === true){command = true;}
			var msgData = {
				from : nick,
				channel : channel,
				message : text,
				command : command
			};
			newMsg(msgData);
		});
		
		socket.on('pm', function (from, message) {
			newTab(from);

			var msgData = {
				from : from,
				channel : from,
				message : message
			};
			newPmMsg(msgData);
		});

		socket.on('realNick', function (data) {
		  options.nickname = data.nick;
		});

		socket.on('disconnected', function () {
			socket.removeAllListeners();

			tabs.html('');
			tabViews.html('');
			ircStuff.hide();
			connectForm.show();
			document.title = 'nirc';
		});
    // END SOCKET LISTENERS

		//-----------------Send-message----------------------
		textInput.keypress(function (e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			var input = textInput.val();

			if (code == 13) {
			    if (input.search(/^[\/]/) == 0) {
				
					var splitInput = input.split(' ');
					var type = splitInput[0];
					var text = input.substring( input.indexOf(" ") + 1, input.length );
					var command;
					
					if (type === '/me'){command = true;}
					else {command = false;}
					
					var msgData = {
						from : options.nickname,
						channel : thisChannel,
						message : text,
						command : command
					};
					
					lastText = $(textInput).val();
					newMsg(msgData);
					socket.emit('command', thisChannel, type, text);
					textInput.val('');
				}
				else if (input !== '') {
				
					var msgData = {
						from : options.nickname,
						channel : thisChannel,
						message : input
					};

					lastText = $(textInput).val();
					newMsg(msgData);
					socket.emit('message', thisChannel, input);
					textInput.val('');
				}
			}
		});
		
		$(textInput).keydown(function (e) {
			var code = (e.keyCode || e.which);
			if (code == 38) {
				$(textInput).val(lastText);
			}
		});

    // SETUP KEY BINDINGS
    Mousetrap.bind('ctrl+left', function () {
      changeTabWithKeyboard('left');
    });

    Mousetrap.bind('ctrl+right', function () {
      changeTabWithKeyboard('right');
    });
    // END KEY BINDINGS
  };
})(jQuery);
