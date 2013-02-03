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
    var commandInput  = $('#command-input');
    var supportsNotifications = !!window.webkitNotifications;
    var iconURL = "/images/nirc32.png";

    var getTabView = function(title) {
      return $('.tab-view[title="'+title+'"]');
    };

	 // Taken from: https://github.com/thedjpetersen/subway/blob/38923d864642ef491298b69567e826241d2b0147/assets/js/utils.js
    // Find and link URLs
    // TODO: put youtube and image embedding code
    // into own function
    var linkify = function(text) {
      // see http://daringfireball.net/2010/07/improved_regex_for_matching_urls
      var links = [];
      var re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
      var parsed = text.replace(re, function(url) {
        // turn into a link
        var href = url;
        if (url.indexOf('http') !== 0) {
          href = 'http://' + url;
        }
        links.push(href);
        return '<a href="' + href + '" target="_blank">' + url + '</a>';
      });
      if (links.length>0){
        //Look for embeddable media in all the links
        for (var i=0; i<links.length; i++){
          var href = links[i];
          //Add embedded youtube video
          /*if (href.search('http://www.youtube.com') > -1) {
            var video_id = href.split('v=')[1];
            var targetPosition = video_id.indexOf('&');
            if(targetPosition !== -1) {
              video_id = video_id.substring(0, targetPosition);
            }
            parsed = parsed.split('</div><div class=\"chat-time\">').join(ich.youtube_embed({video_id:video_id}, true) + '</div><div class=\"chat-time\">');
          }*/
  
          //Add embedded images
          if (jQuery.inArray(href.substr(-3), ['jpg', 'gif', 'png']) > -1 || jQuery.inArray(href.substr(-4), ['jpeg']) > -1) {
            parsed += '<div class="img-preview"><a href="'+href+'" target="_blank"><img src="' + href + '" /></a></div>';
          }
        }
      }
      return parsed;
    }

    var newMsg = function (msgData) {
      var msgType   = (msgData.reciever == 'status' ? 'status' : 'channel');

      var tab       = $('.tab[title="'+msgData.receiver.toLowerCase()+'"]');
      var tabView   = getTabView(tab.attr('title'));
      var newLine   = $('<div>').addClass('line ' + msgType);
      var actualMsg = $('<span>');
      
      
      var timestamp = $("<span>").addClass('timestamp').text(new Date().toString().split(' ')[4]);
      newLine.append(timestamp);

      if (msgType == 'channel' && msgData.from !== undefined) {
        if (!tab.hasClass('active')) {
          tab.addClass('new-msgs');
        }

        var msgFrom = $('<span>').addClass('from').text(msgData.from + ': ');
        var mentionRegex = new RegExp("(^|[^a-zA-Z0-9\\[\\]{}\\^`|])" + options.nickname + "([^a-zA-Z0-9\\[\\]{}\\^`|]|$)", 'i');
        var containsMention = msgData.message.match(mentionRegex);

        if (msgData.fromYou) {
          msgFrom.addClass('from-you');
        } 
        else if (containsMention) {
          //window.hasFocus is set by me in document-dot-ready.js
          var tabNotFocused = !(document.hasFocus() && window.hasFocus && tab.hasClass('active'));
          newLine.addClass('mentioned'); //for highlighting
          // if either the user is in another browser tab/app, or if the user is in a diff irc channel
          if (tabNotFocused) { //bring on the webkit notification
            var notification = newNotification(msgData.message, msgData.receiver, iconURL);
            if (notification) { //in case they haven't authorized, the above will return nothin'
              notification.onclick = function() { 
                window.focus(); //takes user to the browser tab
                focusTab(tab); //focuses the correct channel tab
                this.cancel(); //closes the notification
              };
              notification.show();
            }
          }
        }

        newLine.append(msgFrom);
      }
      
      actualMsg.text(msgData.message);
      actualMsg.html(linkify(msgData.message));
      newLine.append(actualMsg);

      tabView.append(newLine)
             .scrollTop(tabView[0].scrollHeight);
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
      }
      
      var tabViewToActive = $('.tab-view[title="'+tabToActivate.attr('title')+'"]');

      activateTab(tabToActivate, tabViewToActive);
    }

    var newTab = function (tabName) {
      if ($('.tab[title="'+tabName.toLowerCase()+'"]').length == 0) {
        $('.tab').removeClass('active');
        $('.tab-view').removeClass('active');

        var tab = $('<li>').attr('title', tabName.toLowerCase())
                           .addClass('tab active')
                           .text(tabName);

        tab.click(focusTab);

        tabs.append(tab);

        var tabView = $('<div>').attr('title', tabName.toLowerCase())
                                .addClass('tab-view active');

        var nickList = $('<ul>').addClass('nicklist');
        tabView.append(nickList);

        tabViews.append(tabView);
      }
    }

    var closeTab = function (tabName) {
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

    socket.on('channel_add_nicks', function(data){
      var tabView   = getTabView(data.channel);
      var nickList  = tabView.find('.nicklist');

      for (var i in data.nicks) {
        var nick          = data.nicks[i];
        var nickIsInList  = false;

        $.each(nickList.children(), function (i, e) {
          if ($(e).text() == nick) { nickIsInList = true; }
        });

        if (!nickIsInList) {
          var nickLi = $('<li>').text(nick);
          nickList.append(nickLi);
        }
      }
    });

    socket.on('channel_remove_nick', function(data){
      var tabView = getTabView(data.channel);
      var nickList = tabView.find('.nicklist');

      $.each(nickList.children(), function (i, e) {
        if ($(e).text() == data.nick) {
          $(e).remove();
        }
      });
    });

    socket.on('change_nick', function(data){
      var tabView = getTabView(data.channel);
      var nickList = tabView.find('.nicklist');

      $.each(nickList.children(), function (i, e) {
        if ($(e).text() == data.oldnick) {
          $(e).text(data.newnick);
        }
      });
    });

    socket.on('successfullyPartedChannel', function (data) {
      closeTab(data.channel);
    });

    socket.on('message', function (data) {
      if (data.receiver.search(/^[#]/) == -1 && data.receiver != 'status') newTab(data.from);

      var msgData = {
        receiver: data.receiver,
        message:  data.message,
        from:     data.from
      }
      
      newMsg(msgData);
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

    // CAPTURE USER TYPING
    commandInput.keypress(function (e) {
      var code = (e.keyCode ? e.keyCode : e.which);

      if (code == 13) { // user pressed enter
        var input = commandInput.val();

        if (input != '') {
          if (input.search(/^[\/]/) == 0) {
            // user is trying to use irc commands
						var splitInput 	= input.split(' ');
						var command 		= splitInput[0].substr(1).toLowerCase();
						
            // if a user types the command like /part or /topic be sure to send
            // the currently active channel
            if (splitInput.length == 1 && command != 'quit') {
              if (command == 'clear') {
                $('div .tab-view.active').html("");
                commandInput.val('');
                return;
              }
              var activeTab = $('.tab.active').text();

              if (activeTab == 'status') {
                commandInput.val('');
                return;
              }
              else {
                input = input + ' ' + activeTab;
              }
            }
						else if (command == 'msg') {
							var commandSplit 	= input.split(' ');
							var receiver 			= commandSplit[1];
							var message 			= commandSplit.splice(2, commandSplit.length - 2).join(' ');

							if (receiver.search(/^#/) == -1) {
								newTab(receiver);
							}
							
							if ($('.tab[title="' + receiver + '"]').length == 1) {
								newMsg({
									receiver: receiver,
									from:     'you',
									fromYou:  true,
									message:  message
								});
							}
							else {
								commandInput.val('');
								return;
							}
						}
						
						 commandInput.val('');
          }
          else {
            // normal message to current tab-view
            var receiver = $('.tab.active').attr('title');

            commandInput.val('');
            if (receiver == 'status') return;
						
						newMsg({
							receiver: receiver,
							from:     'you',
							fromYou:  true,
							message:  input
						});
						
						input = '/msg ' + receiver + ' ' + input;
          }

					socket.emit('command', input);
        }
      }
    });
    // END CAPTURE USER TYPING
		
		window.onbeforeunload = function () {
			socket.emit('command', '/quit');
		}
		
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
