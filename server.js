/*
  Dependencies
*/
var express = require('express'),
    http    = require('http');

/*
  Initialize & Configure Express
*/

var app = express();

app.configure(function () {
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
});

/*
  Initialize the Server
*/
var server = http.createServer(app).listen(process.env.PORT || 3000);

/*
  Load Main (Loads Socket.io & IRC)
*/
require('./lib/main.js')(server);
