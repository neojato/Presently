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

.controller('MainCtrl', function($scope, $timeout, Weather) {
  // Build the date object
  $scope.date = {};

  // Update function
  var updateTime = function() {
    $scope.date.raw = new Date();
    $timeout(updateTime, 1000);
  }

  $scope.weather = {}
  // Hardcode San_Francisco for now
  Weather.getWeatherForecast("CA/San_Francisco")
    .then(function(data) {
      $scope.weather.forecast = data;
    });

  // Kick off the update function
  updateTime();
})

.controller('SettingsCtrl',
  function($scope) {
    // Our controller will go here
});
