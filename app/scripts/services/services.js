'use strict';

var app = angular.module('angularMlApp.services', []);

app.service('DataService', [ '$http', function ($http) {
	this.getDBResponse =  function (dbname) {
			var  url = '/manage/v2/databases/'+ dbname + '?format=json';
			var response = $http({method: 'GET', url: url});	
			return response;
		};
	
	this.getForestResponse = function (forestName) {
		var  url = '/manage/v2/forests/'+ forestName + '?format=json';
		var response = $http({method: 'GET', url: url});
		return response;
	};	
		
	this.getClusterResponse = function (clusterName) {
		var  url = '/manage/v2/clusters/'+ clusterName + '?format=json';
		var response = $http({method: 'GET', url: url});
		return response;
	};
				
}]); 

app.factory('Resource', ['$http', '$q', function ($http, $q) {
	var Resource = {
		masterDB: null,
		replicaDBs: {},
		replicaClusters: [],
		masterForests: null,
		forestHosts:[],
		forestsOnHosts: {},
	
	
	setMasterDB: function (dbname) {
		console.log('inside setMasterDB', dbname);
		this.masterDB = dbname;
	},


	getMasterForests: function(dbname) {
		var  url = '/manage/v2/databases/'+ dbname + '?format=json';
		var self = this;
		
		return	$http.get(url).then(function (response) {
			self.masterForests = getAttachedForests(response.data);
			console.warn('Master Forests = ', JSON.stringify(self));
	});
	},

	getResources: function (dbname) {
		var  url = '/manage/v2/databases/'+ dbname + '?format=json';
		return $http.get(url).then(function (response) {
			Resource.masterForests = getAttachedForests(response.data);
			console.warn('Master Forests = ', Resource.masterForests);
			return response;
		}).then(function (response) {
			Resource.replicaClusters = getReplicaClusters(response.data);
			console.warn('Replica Cluster = ',Resource.replicaClusters);
			return Resource.replicaClusters;
		}).then(function(replicaClusters) {
			var arr = [];
			angular.forEach(replicaClusters, function(cluster) {
				arr.push($http.get('/manage/v2/clusters/'+ cluster + '?format=json'));
			});
			$q.all(arr).then(function(results) {
				angular.forEach(results, function(result) {
					var cluster = result.data['foreign-cluster-default'].name;
					var dbs = getReplicaDBs(result.data);
					Resource.replicaDBs[cluster] = dbs; 
				});
			});
			// var  url = '/manage/v2/clusters/'+ replicaClusters + '?format=json';
			// return	$http.get(url).then(function(response) {
			// 	console.log('response from cluster', response);
			// 	Resource.replicaDBs = getReplicaDBs(response.data);	
			// });
			
		}).then(function() {
			var arr = [];
				angular.forEach(Resource.masterForests, function(forestName){
					arr.push($http.get('/manage/v2/forests/'+ forestName + '?format=json'));
				});
				 $q.all(arr).then(function (results) {
				angular.forEach(results, function(result){
					var host = getForestHost(result.data);
					var forest = result.data['forest-default'].name;
					Resource.forestHosts.push(host);
					// group forest by hosts
					groupForestsByHost(Resource,host, forest);
					
				});
			});
		});
	}


	};



	console.warn('RESOURCES: ', Resource);
	return Resource;
	
}]);

function getReplicaDBs (response) {
	var replicaDBs = [];
	var relGroup  = response['foreign-cluster-default']['relations']['relation-group'];
		angular.forEach(relGroup, function(value){
		if (value.typeref === 'databases') {
			angular.forEach(value.relation, function(database){
				if (database.roleref === 'replica') {
					replicaDBs.push(database.nameref);
				}
			});
		}
	});
	console.log('replica database = ', replicaDBs);
	return replicaDBs;
}



function groupForestsByHost (resourceObj, host, forest) {
	if (resourceObj.forestsOnHosts[host] === null || resourceObj.forestsOnHosts[host] === undefined) {
							resourceObj.forestsOnHosts[host] = new Array(forest);
					} else{
						var arr = resourceObj.forestsOnHosts[host];
						arr.push(forest);
					}
}


function getAttachedForests(response) {
//	console.log('response sent to getAttachedForests', response);
	var forests = [];
	var relGroup = response['database-default']['relations']['relation-group'];
	angular.forEach(relGroup, function(value) {
		if (value.typeref === 'forests') {
			angular.forEach(value.relation, function(forest) {
				forests.push(forest.nameref);
			});
		}

	});
//	forests.sort();
	return forests;
}
 

function getReplicaClusters(response) {
	var clusters = [];
	var relGroup = response['database-default']['relations']['relation-group'];
	angular.forEach(relGroup, function(value){
		if (value.typeref === 'clusters') {
			angular.forEach(value.relation, function(cluster){
				if (cluster.roleref === 'replica') {
					clusters.push(cluster.nameref);
				}
			});
		}
	});
	console.log("cluster = " + clusters);
	return clusters;
}

function getForestHost(response) {
	var forestHost = [];
	var relGroup = response['forest-default']['relations']['relation-group'];
	angular.forEach(relGroup, function(value) {
		if (value.typeref === 'hosts') {
			angular.forEach(value.relation, function(host) {
				forestHost = host.nameref;
			});
		}
	});
	return forestHost;
}
