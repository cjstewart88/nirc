var net  = require('net'),
    tls  = require('tls'),
    util = require('util');
var Message = require('irc-message');

var Client = function(opts) {
  this.opts = opts;
};

util.inherits(Client, process.EventEmitter);

Client.prototype.connect = function() {
  var method  = this.opts.ssl ? tls : net,
      opts    = this.opts;

  this.socket = method.connect({
    host: opts.server, port: opts.port || 6667
  }, function() {
    this.connected = true;
    this.login();
  }.bind(this));

  this.run();
};

Client.prototype.disconnect = function() {
  if (this.socket) {
    this.socket.destroy();
    this.socket = null;
  }
};

Client.prototype.run = function() {
  this.socket.setEncoding('utf8');
  this.buffer = '';

  this.socket.on('data', function(data) {
    this.buffer += data;
    this.read_messages();
  }.bind(this));

  this.socket.on('error', function(err) {
    console.log("error", err);
  }.bind(this));

  this.socket.on('close', function(had_error) {
    console.log("close", had_error);
  }.bind(this));

};

Client.prototype.login = function() {
  var opts = this.opts;
  if (opts.password) {
    this.socket.write("PASS " + opts.password + "\r\n");
  }
  this.socket.write("USER user localhost localdomain :nIRC User\r\n");
  this.socket.write("NICK " + opts.nick + "\r\n");

};

Client.prototype.read_messages = function() {
  var i, msg;

  while((i = this.buffer.indexOf('\n')) != -1) {
    msg = this.buffer.substr(0, i - 1);
    this.buffer = this.buffer.substr(i + 1);
    this.dispatch_message(Message(msg));
  }

};

Client.prototype.dispatch_message = function(msg) {
  this.emit('message', msg);
};

module.exports.Client = Client;
