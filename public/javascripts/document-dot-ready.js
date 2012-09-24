$(document).ready(function () {
	// initialize web socket
	var socket = io.connect(null);

  // prepopulate fields with last used values
  if (typeof(Storage) !== "undefined" && localStorage && localStorage.ircOptions) {
    var opts = JSON.parse(localStorage.ircOptions);
    
    for (option in opts) {
      $('#' + option).val(opts[option]);
    }
  }

  // initialize nirc
  $('#connect').click(function () {
    $.nirc(socket);
  });
});