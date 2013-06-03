/*
  Dependencies
*/
var express = require('express'),
    ejs     = require('ejs'),
    http    = require('http');

/*
  Initialize & Configure Express
*/

var app = express();

app.configure(function () {
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'html');
  app.set('views', __dirname + '/views');
  app.use(express.static(__dirname + '/public'));
  app.use(express.favicon(__dirname + '/public/images/nirc.ico'));
  app.get('/', function(req, res) { res.render('index'); });

});

/*
  Initialize the Server
*/
var server = http.createServer(app).listen(process.env.PORT || 3000);

/*
  Load Main (Loads Socket.io & IRC)
*/
require('./lib/main.js')(server);
