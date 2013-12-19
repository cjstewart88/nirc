angular.module('nirc')

  .directive('onEnter', function() {
    return {
      restrict: 'A',
      scope: {
        onEnter: '&'
      },
      link: function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
          if (event.which === 13) {
            scope.$apply(function() {
              scope.onEnter({ text: element.val() });
              element.val('');
              event.preventDefault();
            });
          }
      });
      }
    };
  });
