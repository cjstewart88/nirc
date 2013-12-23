angular.module('nirc', ['ngSanitize'])
  .controller('RootCtrl', function($scope, $location) {
    $scope.themes = ['classic', 'night', 'paper'];
    $scope.theme  = $location.search().theme || $scope.themes[0];

    $scope.setTheme = function(t) {
      $scope.theme = t;
    };
  })

  .controller('MainCtrl', function($scope, Client, Mousetrap) {
    $scope.client = Client;

    /* these are kind of ugly.  perhaps refactor the statusChannel to be inside the
     * channels[] array to remove some pain here */
    Mousetrap.bind('command+left', function(e) {
      e.preventDefault();
      Client.previousChannel();
    });

    Mousetrap.bind('command+right', function(e) {
      e.preventDefault();
      Client.nextChannel();
    });

  })

  .controller('TabCtrl', function($scope) {
    $scope.expanded = true;

    $scope.iconFor = function(ch) {
      return ch.activity && !$scope.isActive(ch) ? 'fa-comment' : 'fa-comment-o';
    };

    $scope.isActive = function(ch) {
      return $scope.client.activeChannel === ch;
    };

    $scope.setActive = function(ch) {
      return $scope.client.setActive(ch);
    };

    $scope.toggleExpand = function() {
      $scope.expanded = !$scope.expanded;
    };

  })

  .controller('UserCtrl', function($scope, Channel) {
    $scope.messageTo = function(user) {
      var ch;

      if ((ch = $scope.client.channel(user.nick))) {
        $scope.client.activeChannel = ch;
      } else {
        ch = new Channel(user.nick);
        $scope.client.channels.push(ch);
        $scope.client.activeChannel = ch;
      }
    };
  });
