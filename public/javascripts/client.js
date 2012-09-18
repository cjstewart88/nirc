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

	  var socket  		  = io.connect(null);
	  
    var connectForm   = $('#connect-form');
		var ircStuff		  = $('#irc-stuff');
		var tabs          = $('#tabs');
		var tabViews 	    = $('#tab-views');
		var commandInput 	= $('#command-input');

		var newMsg = function (msgData) {
		  var msgType = msgData.type;
		  
		  var tabView = $('.tab-view[title="'+msgData.receiver.toLowerCase()+'"]');
		  var newLine = $('<div>').addClass('line ' + msgType);

		  if (msgType == 'client') {
		    var msgFrom  = $('<b>').text(msgData.from + ': ');
		    
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
          $(this).addClass('active');

          $('.tab-view').removeClass('active');
          var activeTabView = $('.tab-view[title="'+$(this).attr('title')+'"]');
          activeTabView.addClass('active');
          activeTabView.scrollTop(activeTabView[0].scrollHeight);
          
          commandInput.focus();
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
  	    var tabToActivate   = tab.prev();
  		  var tabViewToActive = $('.tab-view[title="'+tabToActivate.attr('title')+'"]'); 
  		  
  		  tabToActivate.addClass('active');
  		  tabViewToActive.addClass('active');
		  }
		  
		  tab.remove();
		  tabView.remove();
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

    socket.on('newInfoMsg', function(data){
      newMsg({
        receiver: 'status',
        message:  data.args.join(' '),
        type:     'server'
      });
    });

		socket.on('successfullyJoinedChannel', function (data) {
			newTab(data.channel);
		});

		socket.on('userJoinedChannel', function (data) {
			// this will be used when there's a channel user list
		});

		socket.on('successfullyPartedChannel', function (data) {
		  closeTab(data.channel);
		});

		socket.on('userPartedChannel', function (data) {
			// this will be used when there's a channel user list
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
		// END SOCKET LISTENERS
		    
    // CAPTURE USER TYPING
    commandInput.keypress(function (e) {
			var code = (e.keyCode ? e.keyCode : e.which);

			if (code == 13) { // user pressed enter
				var input = commandInput.val();

				if (input != '') {
					if (input.search(/^[\/]/) == 0) {
					  /* 
					    user is trying to use irc commands 
					  */

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
						  message:  input,
      			  type:     'client'
						});

						commandInput.val(''); 
					}
				}
			}
		});
		// ENDER CAPTURE USER TYPING
  };
})(jQuery);