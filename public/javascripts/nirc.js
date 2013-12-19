angular.module('nirc', ['ngSanitize'])

  .controller('MainCtrl', function($scope, Client) {
    $scope.client = Client;
  })

  .controller('TabCtrl', function($scope) {

    $scope.iconFor = function(ch) {
      return ch.activity && !$scope.isActive(ch) ? 'fa-comment' : 'fa-comment-o';
    };

    $scope.isActive = function(ch) {
      return $scope.client.activeChannel === ch;
    };

    $scope.setActive = function(ch) {
      return $scope.client.setActive(ch);
    };

  });
