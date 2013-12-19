angular.module('nirc', [])

  .controller('MainCtrl', function($scope, Client) {

    $scope.client = Client;

    $scope.say = function(command) {
      $scope.client.say(command);
    };

  })

  .controller('TabCtrl', function($scope) {

    $scope.isActive = function(ch) {
      return $scope.client.activeChannel === ch;
    };

    $scope.setActive = function(ch) {
      return $scope.client.setActive(ch);
    };

  });
