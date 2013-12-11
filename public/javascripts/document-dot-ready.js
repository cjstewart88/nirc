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
    if (!navigator.onLine) {
      alert('You must be connected to the internet.');
      return false;
    }

    // if supports webkit notifications, and if they haven't allowed already
    if (window.webkitNotifications && navigator.userAgent.indexOf("Chrome") > -1) {
      if (window.webkitNotifications.checkPermission() == 1) {
        window.webkitNotifications.requestPermission();
      }
    } else if (window.Notification && navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
      if (Notification.permission == 'default') {
        Notification.requestPermission(function(perm) {
          alert(perm);
        });
      }
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
