angular.module('nirc')

  .directive('scrollGlue', function() {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        var elem = element[0];
        var glued = true;

        element.bind('scroll', function() {
          /* we should stick to the bottom if the scroll is currently at the
           * bottom of the element. */
          glued = (elem.scrollTop + elem.clientHeight + 1 >= elem.scrollHeight);
        });

        scope.$watch(function() {
          if (glued) {
            /* stick to the bottom */
            elem.scrollTop = elem.scrollHeight;
          }
        });
      }
    };
  });
