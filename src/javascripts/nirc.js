angular.module('nirc', ['ngSanitize'])
  .config(function($locationProvider) {
    $locationProvider.html5Mode(true);
  })
  .controller('RootCtrl', function($scope, $location) {
    $scope.themes = ['classic', 'night', 'paper'];
    $scope.theme  = $location.search().theme || $scope.themes[0];

    $scope.setTheme = function(t) {
      $scope.theme = t;
    };
  })

  .controller('MainCtrl', function($scope, Client, Mousetrap, Notification, Config) {
    $scope.client = Client;
    $scope.config = Config;

    $scope.connect = function() {
      $scope.config.save();
      $scope.client.connect($scope.config);
    };

    Mousetrap.bind('command+left', function(e) {
      e.preventDefault();
      Client.previousChannel();
    });

    Mousetrap.bind('command+right', function(e) {
      e.preventDefault();
      Client.nextChannel();
    });

    $scope.$on('mention', function(ev, mention) {
      if (mention.channel !== $scope.client.activeChannel) {

        Notification.notify(mention.channel.name, {
          body: mention.event.from.nick + ": " + mention.event.message,
          icon: '/images/nirc32.png',
          timeout: 8000
        }).then(function() {
          Client.setActive(mention.channel);
        });

      }
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

    $scope.closeTab = function(ch) {
      if (ch.name.charAt(0) == '#') {
        $scope.client.part(ch);
      }
      else {
        $scope.client.removeChannel(ch.name);
      }
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
