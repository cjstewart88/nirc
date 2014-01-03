angular.module('nirc')

  .directive('readLine', function() {
    return {
      restrict: 'A',
      scope: {
        readLine: '&',
        completeFrom: '=?'
      },
      link: function (scope, element, attrs) {
        var history = [];
        var index   = history.length;
        var complete;

        function addHistory(text) {
          history.push(text);
          index = history.length;
        }

        function suggestHistory(d) {
          index += d;
          if (index < 0) {
            index = 0;
          } else if (index > history.length) {
            /* we use history[history.length] (which would be undefined) as
             * a blank line. */
            index = history.length;
          }
          return history[index] || '';
        }

        function suggestComplete(content) {
          if (!scope.completeFrom || !content || !content.length) {
            return null;
          }

          var guess = _.find(scope.completeFrom, function(item) {
            return item.toString().indexOf(content) === 0;
          });

          return guess ? guess.toString() : null;
        }

        element.bind("keydown keypress", function (event) {
          switch(event.which) {
          case 9:
            /* tab */
            var orig = element.val();
            if ((complete = suggestComplete(orig))) {
              element.val(complete);
              element[0].setSelectionRange(orig.length, complete.length);
            }
            event.preventDefault();
            break;
          case 13:
            /* enter */
            scope.$apply(function() {
              var text = element.val();
              element.val('');
              scope.readLine({ text: text });
              addHistory(text);
              event.preventDefault();

            });
            break;
          case 38:
            /* up */
            element.val(suggestHistory(-1));
            event.preventDefault();
            break;
          case 40:
            /* down */
            element.val(suggestHistory(1));
            event.preventDefault();
            break;
          }
      });
      }
    };
  });
