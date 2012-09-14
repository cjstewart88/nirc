function openConnection (options) {
	if (options.server == "" || options.nickname == "" || options.channels == "") {
		alert("Fields marked with * are required");
	}
	else {
		var socket  		= io.connect(null);
		
		var connectForm = $('#connectForm');
		var ircStuff		= $('#ircStuff');
		var chatLog 		= $('#chatLog');
		var msgInput 		= $('#msgInput');
		
		function newMsg (msgData) {
			chatLog.append("<div class='line'><i>" + msgData.receiver + "</i> <b>" + msgData.from + ":</b> " + msgData.message + "</div>");  
			
			chatLog.scrollTop(chatLog[0].scrollHeight);
		}
		
		socket.on('connect', function () {	  
			socket.emit('connectToIRC', { options: options });
			
			connectForm.hide();
			ircStuff.show();
			
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