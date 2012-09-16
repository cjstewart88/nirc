function openConnection (options) {
	if (options.server == "" || options.nickname == "" || options.channels == "") {
		alert("Fields marked with * are required");
	}
	else {
		var socket  		  = io.connect(null);
		
		var connectForm   = $('#connect-form');
		var ircStuff		  = $('#irc-stuff');
		var channelsList  = $('#channel-list');
		var channelPanes 	= $('#channel-panes');
		var msgInput 		  = $('#msg-input');
		
		function newMsg (msgData) {
		  var chatLog = $('.channel-log[title="'+msgData.receiver.toLowerCase()+'"]');
		  
		  chatLog.append("<div class='line'><b>" + msgData.from + ":</b> " + msgData.message + "</div>");
			
			chatLog.scrollTop(chatLog[0].scrollHeight);
		}
		
		function joinedChannel (channel) {
		  var firstChannel = (channelsList.children().length > 0 ? false : true);
		  
		  if ($('.channel-list-channel-item[title="'+channel.toLowerCase()+'"]').length == 0) {
  		  var channelListItem = $('<li>').attr('title', channel.toLowerCase())
  		                                 .addClass('channel-list-channel-item ' + (firstChannel ? 'active' : ''))
  		                                 .text(channel);
                                       
        channelListItem.click(function () {
          $('.channel-list-channel-item').removeClass('active');
          $(this).addClass('active');
          $('.channel-log').removeClass('active');
          $('.channel-log[title="'+$(this).attr('title')+'"]').addClass('active');
        });
        
    	  channelsList.append(channelListItem);

        var channelLog = $('<div>').attr('title', channel.toLowerCase())
                                   .addClass('channel-log ' + (firstChannel ? 'active' : ''));
                                   
        channelPanes.append(channelLog);
		  }
		}
		
		socket.on('connect', function () {	  
			socket.emit('connectToIRC', { options: options });
			
			connectForm.hide();
			ircStuff.show();
			
			socket.on('joinedChannel', function (data) {
				joinedChannel(data.channel);
			});
			
			socket.on('newChannelMessage', function (data) {
				newMsg({
				  receiver: data.channel, 
				  from:     data.from, 
				  message:  data.message
				});
			});
			
			socket.on('newPrivateMessage', function (data) {
				newMsg({
				  receiver: 'pm to you from',
				  from:     data.from, 
				  message:  data.message
				});
			});

			socket.on('clientDisconnected', function (data) {
			
			});
		});
		
		// catch client is typing
		msgInput.keypress(function (e) {
			var code = (e.keyCode ? e.keyCode : e.which);
			
			if (code == 13) { // user pressed enter
				var input = msgInput.val();
				
				if (input != '') {
					var args = input.split(' ');
					
					if (args[0] == '/msg') {
						socket.emit('sendMsg', { to: args[1], message: input.slice(args[0].length+args[1].length+2) });
						
						newMsg({
						  receiver: args[1].search(/^[#]/) == 0 ? args[1] : 'pm to ' + args[1] + ' from', 
						  from:     "you", 
						  message:  input.slice(args[0].length+args[1].length+2)
						});
						
						msgInput.val('');
					}
					else {
						alert('You need to tell what user or channel to send the message to! ex: /msg #channame /msg username');
					}
				}
			}
		});
	}
}