//
// Client-side irc.js. This has nothing to do with node.js.
//
// This is a model for an IRC client. While I think the best way to do this
// would be to have this thing subscribed to socket events, and then the UI
// subscribed to events emitted by this thing, that's not the case here.
// Instead, the stuff in this file is dumb, passive. It is merely to act
// as a datastore for client.js, which currently both reacts to all the
// socket messages, and manipulates the UI.
//
// Honestly I'm not quite sure how all that dollar-sign shit works w.r.t. jQuery,
// so maybe someone else should wrap this file in that crap.
//

var nickWithChanModes = /([\@\%\+\&\!\~]*)(.*)/; // chars prepended to a user's nick to indicate channel access level

function ircClient() {
  this._channels = {}; // keyed on lowercase chan name
}

ircClient.prototype.addChannel = function(name) {
  if (this._channels[name.toLowerCase()]) { throw "Channel already exists"; }
  var c = new ircChannel(name);
  this._channels[name.toLowerCase()] = c;
  return c;
};

ircClient.prototype.channels = function() {
  return this._channels;
}

ircClient.prototype.getChannel = function(name) {
  return this._channels[name.toLowerCase()];
}





function ircChannel(name){
  this._name = name;
  this._nicks = []; // without mode chars like @ or +
  this._joinSycned = false; // true once the initial names list has been received
}

ircChannel.prototype.populateNames = function(names) {
  // names is a list of nicks, possibly with mode chars in front of them
  if (this._joinSycned) { throw "I thought we were sync'd already"; }
  for (var i=0; i < names.length; ++i) {
    var bareNick = names[i].match(nickWithChanModes)[2];
    this._nicks.push(bareNick);
    console.debug(bareNick + " added to " + this._name);
  }
}

ircChannel.prototype.endNames = function() {
  if (this._joinSycned) { throw "I thought we were sync'd already"; }
  this._joinSycned = true;
}

ircChannel.prototype.addName = function(nick) {
  // to be called in event of someone's join
  if (this._nicks.indexOf(nick) >= 0) { throw "Adding " + nick + " to " + this._name + " but it was already there!" }
  this._nicks.push(nick);
}

ircChannel.prototype.removeName = function(nick) {
  // to be called in event of someone else's part/kicked/quit
  var i = this._nicks.indexOf(nick);
  if (i >= 0) {
    this._nicks.splice(i, 1);
    return true;
  } else {
    return false;
  }
}