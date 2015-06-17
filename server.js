/*
  Enable HTTPS Webserver
*/

var ssl = false;

/*
  Dependencies
*/
if(ssl === true)
{
  var express = require('express'),
      http    = require('https');
  var fs      = require('fs');

var options = {
  key: fs.readFileSync('/dir/to/your/keyname.key'),
  cert: fs.readFileSync('/dir/to/your/cert.crt')
};

}
else
{
var express = require('express'),
    http    = require('http');
}

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
if(ssl === true)
{
var server = http.createServer(options,app).listen(process.env.PORT || 3000);
}
else
{
var server = http.createServer(app).listen(process.env.PORT || 3000);
}
/*
  Load Main (Loads Socket.io & IRC)
*/
require('./lib/main.js')(server);
