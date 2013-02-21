/*
    irc.js - Node JS IRC client library

    (C) Copyright Martyn Smith 2010

    This library is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This library is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this library.  If not, see <http://www.gnu.org/licenses/>.
*/

exports.Client = Client;
var net  = require('net');
var tls  = require('tls');
var util = require('util');

var colors = require('./colors');
exports.colors = colors;

var replyFor = require('./codes');

function Client(server, nick, opt) {
    var self = this;
    self.opt = {
        server: server,
        nick: nick,
        password: null,
        userName: 'nirc',
        realName: 'node irc',
        port: 6667,
        debug: true,
        showErrors: true,
        autoRejoin: true,
        autoConnect: true,
        channels: [],
        retryCount: null,
        retryDelay: 2000,
        secure: false,
        selfSigned: false,
        certExpired: false,
        floodProtection: false,
        floodProtectionDelay: 1000,
        stripColors: false
    };

    if (typeof arguments[2] == 'object') {
        var keys = Object.keys(self.opt);
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (arguments[2][k] !== undefined)
                self.opt[k] = arguments[2][k];
        }
    }

    if (self.opt.floodProtection) {
        self.activateFloodProtection();
    }

    if (self.opt.autoConnect === true) {
      self.connect();
    }

    self.addListener("raw", function (message) { // {{{
        var messageToEmit = {};

        switch ( message.command ) {
            case "001":
                // Set nick to whatever the server decided it really is
                // (normally this is because you chose something too long and
                // the server has shortened it
                self.nick = message.args[0];
                self.emit('connected', message);
                self.emit('realNick', message.args[0]);
                break;
            case "005":
                message.args.forEach(function(arg) {
                    var match;
                    if ( match = arg.match(/PREFIX=\((.*?)\)(.*)/) ) {
                        match[1] = match[1].split('');
                        match[2] = match[2].split('');
                        while ( match[1].length ) {
                            self.modeForPrefix[match[2][0]] = match[1][0];
                            self.prefixForMode[match[1].shift()] = match[2].shift();
                        }
                    }
                });
                break;
            case 'rpl_notopic':
                messageToEmit.receiver  = message.args[1];
                messageToEmit.message   = '* Topic: no topic set';

                break;
            case 'rpl_topic':
                messageToEmit.receiver  = message.args[1];
                messageToEmit.message   = '* Topic: "' + message.args[2] + '"';

                break;
            case 'rpl_namreply':
                messageToEmit.receiver  = message.args[2];
                messageToEmit.message   = '* Users: ' + message.args[3];

                var channel = self.chanData(message.args[2]);
                var users   = message.args[3].trim().split(/ +/);
                
                if (channel) {
                    users.forEach(function (user) {
                        var match = user.match(/^(.)(.*)$/);
                        if (match) {
                            if (match[1] in self.modeForPrefix) {
                                channel.users[match[2]] = match[1];
                            }
                            else {
                                channel.users[match[1] + match[2]] = '';
                            }
                        }
                    });
                }

                break;
			case 'rpl_endofnames':
                var nicks = [];
                for (var nick in self.chanData(message.args[1]).users) {
                    nicks.push(nick); // Strip mode flag since client doesn't watch it for changes later
                }
                self.emit('channel_add_nicks', {channel: message.args[1], nicks: nicks});
				break;
            case "err_nicknameinuse":
                if (typeof(self.opt.nickMod) == 'undefined') self.opt.nickMod = 0;
                self.opt.nickMod++;
                self.send("NICK", self.opt.nick + self.opt.nickMod);
                self.nick = self.opt.nick + self.opt.nickMod;
                break;
            case "PING":
                self.send("PONG", message.args[0]);
                break;
            case "NOTICE":
                messageToEmit.receiver  = 'status';
                messageToEmit.from      = (message.server ? message.server : message.nick);
                messageToEmit.message   = message.args[1];
                break;
            case "MODE":
                var nick = message.nick;
                var channels = message.args[0];
                var mode = message.args[1];
                var reciever = message.args[2];

                messageToEmit.receiver  = channels;
                messageToEmit.message   = '* ' + nick + " sets mode " + mode + " for " + reciever;

                break;
            case "NICK":
								for (var chanName in self.chans) {
                  var channel = self.chans[chanName];

                  if ('string' == typeof channel.users[message.nick]) {                
                    messageToEmit.receiver  = chanName;

										if (self.nick == message.nick) {
												messageToEmit.message = 'You are now known as ' + message.args[0];                
												self.emit('realNick', message.args[0]);
										}
										else {
												messageToEmit.message = '* ' + message.nick + ' is now known as ' + message.args[0];
										}
                    self.emit('change_nick', {channel: chanName, oldnick: message.nick, newnick: message.args[0]});
                    self.emit('message', messageToEmit);
		    self.nick = message.args[0];
										channel.users[message.args[0]] = channel.users[message.nick]
                    delete channel.users[message.nick];
                  }
                }

								messageToEmit.receiver  = null;
                messageToEmit.message   = null;

                break;
            case "JOIN":
								var channel = message.args[0];

                messageToEmit.receiver  = channel;
                messageToEmit.message   = (self.nick == message.nick ? 'Now talking in ' + channel : '* Joins: '+ message.nick );

                if (self.nick == message.nick) {
										self.opt.channels.push(channel);
                    self.chanData(channel, true);
                    
                    self.emit('successfullyJoinedChannel', channel);
                }
                else {
                    var channel = self.chanData(message.args[0]);
                    channel.users[message.nick] = '';
                    self.emit('channel_add_nicks', {channel: message.args[0], nicks: [message.nick]});
                }

                break;
            case "PART":
                messageToEmit.receiver  = message.args[0];
                messageToEmit.message   = '* Parts: '+ message.nick;

                if (self.nick == message.nick) {
                    var channel = self.chanData(message.args[0]);
                    delete self.chans[channel.key];

                    self.emit('successfullyPartedChannel', message.args[0]);
                }
                else {
                    var channel = self.chanData(message.args[0]);
                    delete channel.users[message.nick];
                    self.emit('channel_remove_nick', {channel: message.args[0], nick: message.nick});
                }

                break;
            case "KICK":
                messageToEmit.receiver  = message.args[0];
                messageToEmit.message   = '* ' + message.args[1] + ' kicked ' + message.nick + ' (Reason: ' + message.args[2] + ')';

                if (self.nick == message.args[1]) {
                    var channel = self.chanData(message.args[0]);
                    delete self.chans[channel.key];

										self.emit('successfullyPartedChannel', message.args[0]);

										if (self.opt.autoRejoin) {
												self.send.apply(self, ['JOIN'].concat(message.args[0]));
										}
                }
                else {
                    var channel = self.chanData(message.args[0]);
                    delete channel.users[message.args[1]];
                    self.emit('channel_remove_nick', {channel: message.args[0], nick: message.nick});
                }

                break;
            case "KILL":
                var nick = message.args[0];
                var channels = [];

                for (var channel in self.chans) {
                    delete self.chans[channel].users[nick];
                }

                messageToEmit.receiver  = 'status';
                messageToEmit.message   = '* Server killed connection.';

                break;
            case "PRIVMSG":
                messageToEmit.receiver  = (message.args[0] == self.nick ? message.nick : message.args[0]);
                messageToEmit.from      = message.nick;
                messageToEmit.message   = message.args[1];
                
                break;
            case "INVITE":
                messageToEmit.receiver  = 'status';
                messageToEmit.message   = '* ' + message.nick + ' invited you to join ' + message.args[1];
                
                break;
            case "QUIT":
                for (var chanName in self.chans) {
                  var channel = self.chans[chanName];

                  if ('string' == typeof channel.users[message.nick]) {                
                    messageToEmit.receiver  = chanName;
                    messageToEmit.message   = '* Quits: ' + message.nick + ' (Message: ' + message.args[0] + ')';

                    self.emit('message', messageToEmit);
                    self.emit('channel_remove_nick', {channel: chanName, nick: message.nick});

                    delete channel.users[message.nick];
                  }
                }

                messageToEmit.receiver  = null;
                messageToEmit.message   = null;

                break;
            default:
                if (message.rawCommand.match(/^\d+$/)) {
                    messageToEmit.receiver  = 'status';
                    messageToEmit.from      = message.server;
                    messageToEmit.message   = message.args.splice(1).join(' ');
                }
                else if (message.commandType == 'error') {
                    util.log("\033[01;31mERROR: " + util.inspect(message) + "\033[0m");
                }
                else {
                    util.log("\033[01;31mUnhandled message: " + util.inspect(message) + "\033[0m");
                }

                break;
        }
        
        if (messageToEmit.receiver != null && messageToEmit.message != null) {
          self.emit('message', messageToEmit);
        }
    }); // }}}

    process.EventEmitter.call(this);
}

util.inherits(Client, process.EventEmitter);

Client.prototype.conn = null;
Client.prototype.prefixForMode = {};
Client.prototype.modeForPrefix = {};
Client.prototype.chans = {};
Client.prototype.chanData = function( name, create ) { // {{{
    var key = name.toLowerCase();
    if ( create ) {
        this.chans[key] = this.chans[key] || {
            key: key,
            serverName: name,
            users: {},
            mode: '',
        };
    }

    return this.chans[key];
} // }}}
Client.prototype.connect = function (retryCount) { // {{{
    if ( typeof(retryCount) === 'function' ) {
        callback = retryCount;
        retryCount = undefined;
    }
    retryCount = retryCount || 0;
		this.once('connected', function () {
				self.send.apply(self, ['JOIN'].concat(self.opt.channels.join(',')));
		});
    var self = this;
    self.chans = {};
    // try to connect to the server
    if (self.opt.secure) {
        var creds = self.opt.secure;
        if (typeof self.opt.secure !== 'object') {
            creds = {};
        }

        self.conn = tls.connect(self.opt.port, self.opt.server, creds, function() {
           // callback called only after successful socket connection
           self.conn.connected = true;
           if (self.conn.authorized ||
               (self.opt.selfSigned &&
                self.conn.authorizationError === 'DEPTH_ZERO_SELF_SIGNED_CERT') ||
                (self.opt.certExpired &&
                   self.conn.authorizationError === 'CERT_HAS_EXPIRED') ||
                (self.opt.selfSigned &&
                 self.conn.authorizationError === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE')
              ) {
              // authorization successful
              self.conn.setEncoding('utf-8');
                if ( self.opt.certExpired &&
                   self.conn.authorizationError === 'CERT_HAS_EXPIRED' ) {
                     util.log('Connecting to server with expired certificate');
                }
                if ( self.opt.password !==  null ) {
                    self.send( "PASS", self.opt.password );
                }
                util.log('Sending irc NICK/USER');
                self.send("NICK", self.opt.nick);
                self.nick = self.opt.nick;
                self.send("USER", self.opt.userName, 8, "*", self.opt.realName);
                self.emit('connect');
           } else {
              // authorization failed
             util.log(self.conn.authorizationError);
           }
        });
    }
    else {
        self.conn = net.createConnection(self.opt.port, self.opt.server);
    }
    self.conn.requestedDisconnect = false;
    self.conn.setTimeout(0);
    self.conn.setEncoding('utf8');
    self.conn.addListener("connect", function () {
        if ( self.opt.password !==  null ) {
            self.send( "PASS", self.opt.password );
        }
        self.send("NICK", self.opt.nick);
        self.nick = self.opt.nick;
        self.send("USER", self.opt.userName, 8, "*", self.opt.realName);
        self.emit("connect");
    });
    var buffer = '';
    self.conn.addListener("data", function (chunk) {
        buffer += chunk;
        var lines = buffer.split("\r\n");
        buffer = lines.pop();
        lines.forEach(function (line) {
            // util.log('>>> ' + line);
            var message = parseMessage(line, self.opt.stripColors);
            try {
                self.emit('raw', message);
            } catch ( err ) {
                if ( !self.conn.requestedDisconnect ) {
                    throw err;
                }
            }
        });
    });
    self.conn.addListener("close", function() {
        if ( self.opt.debug )
            util.log('Connection got "close" event');
        if ( self.conn.requestedDisconnect )
            return;
        if ( self.opt.debug )
            util.log('Disconnected: reconnecting');
        if ( self.opt.retryCount !== null && retryCount >= self.opt.retryCount ) {
            if ( self.opt.debug ) {
                util.log( 'Maximum retry count (' + self.opt.retryCount + ') reached. Aborting' );
            }
            self.emit( 'abort', self.opt.retryCount );
            return;
        }

        if ( self.opt.debug ) {
            util.log( 'Waiting ' + self.opt.retryDelay + 'ms before retrying' );
        }
        setTimeout( function() {
            self.connect( retryCount + 1 );
        }, self.opt.retryDelay );
    });
    self.conn.addListener("error", function(exception) {
        self.emit("netError", exception);
    });
}; // }}}
Client.prototype.disconnect = function (callback) { // {{{
    var self = this;

    if (self.conn.readyState == 'open') {
			self.send("QUIT", "goodbye");
    }

    self.conn.requestedDisconnect = true;
    callback();
}; // }}}
Client.prototype.send = function(command) { // {{{
    var args = Array.prototype.slice.call(arguments);

    // Remove the command
    args.shift();

    if ( args[args.length-1].match(/\s/) ) {
        args[args.length-1] = ":" + args[args.length-1];
    }

    if ( this.opt.debug )
        util.log('SEND: ' + command + " " + args.join(" "));

    if ( ! this.conn.requestedDisconnect ) {
        this.conn.write(command + " " + args.join(" ") + "\r\n");
    }
}; // }}}
Client.prototype.activateFloodProtection = function(interval) { // {{{

    var cmdQueue = [],
        safeInterval = interval || this.opt.floodProtectionDelay,
        self = this,
        origSend = this.send,
        dequeue;

    // Wrapper for the original function. Just put everything to on central
    // queue.
    this.send = function() {
        cmdQueue.push(arguments);
    };

    dequeue = function() {
        var args = cmdQueue.shift();
        if (args) {
            origSend.apply(self, args);
        }
    };

    // Slowly unpack the queue without flooding.
    setInterval(dequeue, safeInterval);
    dequeue();


}; // }}}
Client.prototype.join = function(channel, callback) { // {{{
    this.once('join' + channel, function () {
        // if join is successful, add this channel to opts.channels
        // so that it will be re-joined upon reconnect (as channels
        // specified in options are)
        if (this.opt.channels.indexOf(channel) == -1) {
            this.opt.channels.push(channel);
        }

        if ( typeof(callback) == 'function' ) {
            return callback.apply(this, arguments);
        }
    });
    this.send.apply(this, ['JOIN'].concat(channel.split(' ')));
} // }}}
Client.prototype.part = function(channel, callback) { // {{{
    if ( typeof(callback) == 'function' ) {
        this.once('part' + channel, callback);
    }

    // remove this channel from this.opt.channels so we won't rejoin
    // upon reconnect
    if (this.opt.channels.indexOf(channel) != -1) {
        this.opt.channels.splice(this.opt.channels.indexOf(channel), 1);
    }
    
    this.send('PART', channel);
} // }}}
Client.prototype.say = function(target, text) { // {{{
    var self = this;
    if (typeof text !== 'undefined') {
        text.toString().split(/\r?\n/).filter(function(line) {
            return line.length > 0;
        }).forEach(function(line) {
            self.send('PRIVMSG', target, line);
            self.emit('selfMessage', target, line);
        });
    }
} // }}}
Client.prototype.action = function(channel, text) { // {{{
    var self = this;
    if (typeof text !== 'undefined') {
        text.toString().split(/\r?\n/).filter(function(line) {
            return line.length > 0;
        }).forEach(function(line) {
            self.say(channel, '\u0001ACTION ' + line + '\u0001');
        });
    }
} // }}}
Client.prototype.notice = function(target, text) { // {{{
    this.send('NOTICE', target, text);
} // }}}
Client.prototype.list = function() { // {{{
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('LIST');
    this.send.apply(this, args);
} // }}}
Client.prototype._handleCTCP = function(from, to, text, type) {
    text = text.slice(1)
    text = text.slice(0, text.indexOf('\1'))
    var parts = text.split(' ')
    this.emit('ctcp', from, to, text, type)
    this.emit('ctcp-'+type, from, to, text)
    if (type === 'privmsg' && text === 'VERSION')
        this.emit('ctcp-version', from, to)
    if (parts[0] === 'ACTION' && parts.length > 1)
        this.emit('action', from, to, parts.slice(1).join(' '))
    if (parts[0] === 'PING' && type === 'privmsg' && parts.length > 1)
        this.ctcp(from, 'notice', text)
}
Client.prototype.ctcp = function(to, type, text) {
    return this[type === 'privmsg' ? 'say' : 'notice'](to, '\1'+text+'\1');
}
/*
 * parseMessage(line, stripColors)
 *
 * takes a raw "line" from the IRC server and turns it into an object with
 * useful keys
 */
function parseMessage(line, stripColors) { // {{{
    var message = {};
    var prefix, line, trailing, args, pos, reply;

    if (stripColors) {
        line = line.replace(/[\x02\x1f\x16\x0f]|\x03\d{0,2}(?:,\d{0,2})?/g, "");
    }

    /* handle removing the prefix from the message.
     * this is everything after : and before the first space. */
    if (line[0] === ':') {
        pos    = line.indexOf(' ');
        prefix = line.substr(1, pos - 1);
        line   = line.substr(pos + 1);

        message.prefix = prefix;
        if (match = message.prefix.match(/^([_a-zA-Z0-9\[\]\\`^{}|-]*)(!([^@]+)@(.*))?$/)) {
            message.nick = match[1];
            message.user = match[3];
            message.host = match[4];
        } else {
            message.server = message.prefix;
        }
    }

    /* handle any potential trailing argument, which may have spaces in it */
    if ((pos = line.indexOf(' :')) !== -1) {
        trailing = line.substr(pos + 2);
        line     = line.substr(0, pos);
        args     = line.length != 0 ? line.split(' ') : [];
        args.push(trailing);
    } else {
        args = line.length != 0 ? line.split(' ') : [];
    }

    command = args.shift();

    message.rawCommand  = command;
    message.command     = command;
    message.args        = args;
    message.commandType = 'normal';

    if ((reply = replyFor[message.rawCommand])) {
        message.command     = reply.name;
        message.commandType = reply.type;
    }

    return message;
} // }}}
