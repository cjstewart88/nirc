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
    // if supports webkit notifications, and if they haven't allowed already
    if(window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
      window.webkitNotifications.requestPermission();
    }
    $.nirc(socket);
  });

  //misc listeners for when the tab loses/gains focus
  window.addEventListener('focus', function() {
    window.hasFocus = true;
  });

  window.addEventListener('blur', function() {
    window.hasFocus = false;
  });
});
