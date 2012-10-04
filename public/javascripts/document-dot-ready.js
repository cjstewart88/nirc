$(document).ready(function () {
	// initialize web socket
	var socket = io.connect(null);

  // prepopulate fields with last used values
  if (typeof(Storage) !== "undefined" && localStorage && localStorage.ircOptions) {
    var opts = JSON.parse(localStorage.ircOptions);
    
    // populate each options field, assuming the option name matches the input ID
    // now with logic to accomodate checkboxes!
    for (option in opts) {
      var ele = $('#' + option);
      if (ele.is(':checkbox')) {
        opts[option] ? ele.attr('checked', 'checked') : ele.removeAttr('checked');
      } else {
        ele.val(opts[option])
      }
    }
  }
  // select first empty text field. if none are empty, select the first text field
  $("#connect-form input:first, #connect-form input[value=]:first").last().select();

  // initialize nirc
  $('#connect').click(function () {
    // if supports webkit notifications, and if they haven't allowed already
    if(window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
      window.webkitNotifications.requestPermission();
    }
    $.nirc(socket);
  });

  window.hasFocus = true;
  //misc listeners for when the tab loses/gains focus
  window.addEventListener('focus', function() {
    window.hasFocus = true;
  });

  window.addEventListener('blur', function() {
    window.hasFocus = false;
  });
});
