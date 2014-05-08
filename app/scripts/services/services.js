'use strict';

var app = angular.module('angularMlApp.services', []);

app.service('DataService', [ '$http', function ($http) {
	this.getDBResponse =  function (dbname) {
			var  url = '/manage/v2/databases/'+ dbname + '?format=json';
			var response = $http({method: 'GET', url: url});	
			return response;
		}
	
	this.getForestResponse = function (forestName) {
		var  url = '/manage/v2/forests/'+ forestName + '?format=json';
		var response = $http({method: 'GET', url: url});
		return response;
	}	
				
}]);