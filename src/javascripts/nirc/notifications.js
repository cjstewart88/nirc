angular.module('nirc')
  .factory('Notification', function($q, $rootScope) {
    var supported  = ('Notification' in window),
        nativeNote = window.Notification,
        Notification = {};

    Notification.notify = function(title, opts) {
      var d = $q.defer();
      if (!supported) {
        d.reject();
        return d.promise;
      }

      opts = opts || {};

      var n = new nativeNote(title, opts);

      n.onclick = function() {
        $rootScope.$apply(d.resolve.bind(d));
      };

      /* if timeout provided, auto-close the notification */
      if (opts.timeout) {
        n.onshow = function() {
          window.setTimeout(function() {
            n.close();

            d.reject(); /* user didn't click. */
            $rootScope.$apply();
          }, opts.timeout);
        };
      }

      return d.promise;
    };

    Notification.request = function() {
      var d = $q.defer();

      if (!supported) {
        d.reject();
        return d.promise;
      }

      nativeNote.requestPermission(function(result) {
        if (result === 'granted') {
          d.resolve(result);
        } else {
          d.reject(result);
        }
        $rootScope.$apply();
      });

      return d.promise;
    };

    return Notification;
  });
