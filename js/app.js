angular.module('myApp', ['ngRoute'])
.provider('Weather', function() {
  var apiKey = "";

  this.setApiKey = function(key) {
    if (key) this.apiKey = key;
  };

  this.getUrl = function(type, ext) {
    return "http://api.wunderground.com/api/" +
      this.apiKey + "/" + type + "/q/" +
      ext + '.json';
  };

  this.$get = function($q, $http) {
    var self = this;
    return {
      getWeatherForecast: function(city) {
        var d = $q.defer();
        $http({
          method: 'GET',
          url: self.getUrl("forecast", city),
          cache: true
        }).success(function(data) {
          // The wunderground API returns the
          // object that nests the forecasts inside
          // the forecast.simpleforecast key
          d.resolve(data.forecast.simpleforecast);
        }).error(function(err) {
          d.reject(err);
        });
        return d.promise;
      },
      getCityDetails: function(query) {
        var d = $q.defer();
        $http({
          method: 'GET',
          url: 'http://autocomplete.wunderground.com/aq?query=' + query
        }).success(function(data) {
          d.resolve(data.RESULTS);
        }).error(function(err) {
          d.reject(err);
        });
        return d.promise;
      }
    }
  }
})

.config(function(WeatherProvider) {
  WeatherProvider.setApiKey('227410e53fceeda9');
})

.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'templates/home.html',
      controller: 'MainCtrl'
    })
    .when('/settings', {
      templateUrl: 'templates/settings.html',
      controller: 'SettingsCtrl'
    })
    .otherwise({redirectTo: '/'});
})

.factory('UserService', function() {
  var defaults = {
    location: 'autoip'
  };

  var service = {
    user: {},
    save: function() {
      sessionStorage.presently = angular.toJson(service.user);
    },
    restore: function() {
      // Pull from sessionStorage
      service.user = angular.fromJson(sessionStorage.presently) || defaults;

      return service.user;
    }
  };
  // Immediately call restore from the session storage
  // so we have our user data available immediately
  service.restore();
  return service;
})

.directive('autoFill', function($timeout) {
  return {
    restrict: 'EA',
    scope: {
      autoFill: '&',
      ngModel: '='
    },
    compile: function(tEle, tAttrs) {
      var tplEl = angular.element('<div class="typeahead">' +
      '<input type="text" autocomplete="off" />' +
      '<ul id="autolist" ng-show="reslist">' +
        '<li ng-repeat="res in reslist" ' +
          '>{{res.name}}</li>' +
      '</ul>' +
      '</div>');
      var input = tplEl.find('input');
      input.attr('type', tAttrs.type);
      input.attr('ng-model', tAttrs.ngModel);
      input.attr('timezone', tAttrs.timezone);
      tEle.replaceWith(tplEl);

      return function(scope, ele, attrs, ctrl) {
        var minKeyCount = attrs.minKeyCount || 3,
            timer,
            input = ele.find('input');

        input.bind('keyup', function(e) {
          val = ele.val();
          if (val.length < minKeyCount) {
            if (timer) $timeout.cancel(timer);
            scope.reslist = null;
            return;
          } else {
            if (timer) $timeout.cancel(timer);
            timer = $timeout(function() {
              scope.autoFill()(val)
              .then(function(data) {
                if (data && data.length > 0) {
                  scope.reslist = data;
                  scope.ngModel = data[0].zmw;
                  scope.timezone = data[0].tz;
                }
              });
            }, 300);
          }
        });
        // Hide the reslist on blur
        input.bind('blur', function(e) {
          scope.reslist = null;
          scope.$digest();
        });
      }
    }
  }
})

.controller('MainCtrl', function($scope, $timeout, Weather, UserService) {
  // Build the date object
  $scope.date = {};

  // Update function
  var updateTime = function() {
    $scope.date.tz = new Date(new Date().toLocaleString("en-US", {timeZone: $scope.user.timezone}));
    $timeout(updateTime, 1000);
  }

  $scope.weather = {}
  $scope.user = UserService.user;
  Weather.getWeatherForecast($scope.user.location)
    .then(function(data) {
      $scope.weather.forecast = data;
  });

  // Kick off the update function
  updateTime();
})

.controller('SettingsCtrl', function($scope, UserService, Weather) {
    $scope.user = UserService.user;
    $scope.fetchCities = Weather.getCityDetails;

    $scope.save = function() {
      UserService.save();
    }
});
