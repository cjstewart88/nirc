function openConnection (options) {
	if (options.server == "" || options.nickname == "" || options.channels == "") {
		alert("Fields marked with * are required");
	}
	else {
		var socket  		  = io.connect(null);
		
		var connectForm   = $('#connect-form');
		var ircStuff		  = $('#irc-stuff');
		var tabs          = $('#tabs');
		var tabViews 	    = $('#tab-views');
		var commandInput 	= $('#command-input');
		
		function newMsg (msgData) {
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
		
		function newTab (tabName) {
		  var firstTab = (tabs.children().length > 0 ? false : true);
		  
		  if ($('.tab[title="'+tabName.toLowerCase()+'"]').length == 0) {
		    if (tabName.search(/^[#]/) == 0) {
		      newMsg({  		  
    			  receiver: 'status', 
    			  message:  'joined channel ' + tabName,
    			  type:     'server'
      		});
		    }
		    
  		  var tab = $('<li>').attr('title', tabName.toLowerCase())
  		                     .addClass('tab ' + (firstTab ? 'active' : ''))
  		                     .text(tabName);
                                       
        tab.click(function () {
          $('.tab').removeClass('active');
          $(this).addClass('active');
          
          $('.tab-view').removeClass('active');
          var activeTabView = $('.tab-view[title="'+$(this).attr('title')+'"]');
          activeTabView.addClass('active');
          activeTabView.scrollTop(activeTabView[0].scrollHeight);
        });
        
    	  tabs.append(tab);

        var tabView = $('<div>').attr('title', tabName.toLowerCase())
                                .addClass('tab-view ' + (firstTab ? 'active' : ''));
                                   
        tabViews.append(tabView);
		  }
		}
		
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
		
		socket.on('joinedChannel', function (data) {
			newTab(data.channel);
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
		
		// catch client is typing
		commandInput.keypress(function (e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			
			if (code == 13) { // user pressed enter
				var input = commandInput.val();
				
				if (input != '') {
					if (input.search(/^[\/]/) == 0) {
					  // commands
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
	}
}