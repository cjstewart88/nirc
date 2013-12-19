angular.module('nirc')

  .directive('say', function() {

    return function (scope, element, attrs) {
      element.bind("keydown keypress", function (event) {
        if (event.which === 13) {
          var command = element.val();

          if (command.charAt(0) != '/') {
            command = "/msg " + scope.client.activeChannel.name + ' ' + command;
          }

          scope.say(command);
          element.val('');
          event.preventDefault();
        }
      });
    };

  });