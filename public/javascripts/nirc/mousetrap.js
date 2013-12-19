angular.module('nirc')
  .factory('Mousetrap', function($rootScope) {
    return {
      bind: function(expression, callback) {
        Mousetrap.bind(expression, function(e) {
          var r = callback(e);
          $rootScope.$apply();
          return r;
        });
      }
    };
  });
