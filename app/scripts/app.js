'use strict';

angular
  .module('angularMlApp', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
	'angularMlApp.services'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
	  .when('/chart', {
	          templateUrl: 'views/partials/chart.html',
	          controller: 'ChartCtrl'
	  })
      .otherwise({
        redirectTo: '/'
      });
  });
 