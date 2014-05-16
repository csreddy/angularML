'use strict';

var app = angular.module('angularMlApp');

//app.constant('RESTURL', 'http://localhost:9000');

app.controller('MainCtrl', function($scope, $http) {
	$scope.awesomeThings = [
		'HTML5 Boilerplate',
		'AngularJS',
		'Karma'
	];

	$scope.db = "Meters";
	$scope.init = function() {
		var url = '/manage/v2/databases/' + $scope.db + '?format=json';

		$http({
			method: 'GET',
			url: url
		}).
		success(function(data, status, headers, config) {
			// this callback will be called asynchronously
			$scope.response = data
		}).
		error(function(data, status, headers, config) {
			// called asynchronously if an error occurs
			// or server returns response with an error status.
			$scope.error = status;
		});

	};

});

app.controller('ChartCtrl', ['$scope', 'DataService', 'Resource',
	function($scope, DataService, Resource) {
		$scope.a = "Test";
		var items = [];
		var annotations = [];
		var options = new primitives.orgdiagram.Config();
		$scope.db = "MyMasterDatabase";
		$scope.forestHosts = [];
		$scope.forestsOnHosts = {};


		$scope.renderChart = function() {
			Resource.setMasterDB($scope.db);

			Resource.getResources($scope.db).then(function() {
				$scope.myResource1 = Resource.masterForests;
				$scope.myResource2 = Resource.replicaClusters;
				$scope.myResource3 = Resource.forestHosts;
				$scope.myResource4 = Resource.forestsOnHosts;
				$scope.myResource5 = Resource.replicaDBs;
				$scope.myResource6 = Resource.appservers;
				
				setChartRoot($scope.db);
				pushAppServerToChart($scope.myResource6);
				pushForestsToChart($scope.myResource4);


				options.items = items;
				options.normalLevelShift = 20;
				options.normalItemsInterval = 20;
				options.lineItemsInterval = 20;
				options.hasSelectorCheckbox = primitives.common.Enabled.False;
				$scope.options = options;
				
				$scope.setCursorItem = function(cursorItem) {
					$scope.options.cursorItem = cursorItem;
				};

				});
		};


		$scope.init = function() {
			var url = '/manage/v2/databases/' + $scope.db + '?format=json';

			DataService.getDBResponse($scope.db).then(function(dataResponse) {
				// this callback will be called asynchronously
				$scope.response = dataResponse.data || {};
				$scope.appservers = getAttachedAppServer($scope.response) || [];
				$scope.forests = getAttachedForests($scope.response) || {};
				console.log($scope.appservers);

				// make the database root node 
				items.push(
					new primitives.orgdiagram.ItemConfig({
						id: 0,
						parent: null,
						title: $scope.db,
						description: "master database",
						image: "scripts/demo/images/photos/d.png"
					})
				);
						
				pushAppServerToChart($scope.appservers);
		
				pushForestToChart($scope.forests);
			
				groupForestsByHosts();
				
				$scope.replicaCluster = getReplicaClusters($scope.response);

				//--------------------------
				

					console.warn('Resource from main', Resource);
				
				//----------------------------------------------
				options.items = items;
				options.normalLevelShift = 20;
				options.normalItemsInterval = 20;
				options.lineItemsInterval = 20;
				options.hasSelectorCheckbox = primitives.common.Enabled.False;
				$scope.options = options;
				
				$scope.setCursorItem = function(cursorItem) {
					$scope.options.cursorItem = cursorItem;
				};

			});

			

		};


function setChartRoot (db) {
	// make the database root node 
	items.push(
		new primitives.orgdiagram.ItemConfig({
			id: 0,
			parent: null,
			title: db,
			description: "master database",
			image: "scripts/demo/images/photos/d.png"
		})
	);
}


		function getAttachedAppServer(response) {
			var appservers = [];
			var relGroup = response['database-default']['relations']['relation-group'];
			angular.forEach(relGroup, function(value, key) {
				if (value.typeref === 'servers') {
					angular.forEach(value.relation, function(server, key) {
						appservers.push(server.nameref);
					});
				}
			});
			return appservers;
		}

		function pushAppServerToChart(appservers) {
			angular.forEach(appservers, function(appserver, key) {
				items.push(
					new primitives.orgdiagram.ItemConfig({
						id: items.length + appservers.indexOf(appserver) + 1,
						parent: 0,
						title: appserver,
						description: "app server",
						image: "scripts/demo/images/photos/a.png",
						itemTitleColor: primitives.common.Colors.BurlyWood,
						itemType: primitives.orgdiagram.ItemType.Adviser
						//	  adviserPlacementType: primitives.orgdiagram.AdviserPlacementType.Right,
						//	  groupTitle: "App Server"
					})
				);
				
			});
		}

		function getAttachedForests(response) {
			var forests = [];
			var relGroup = response['database-default']['relations']['relation-group'];
			angular.forEach(relGroup, function(value) {
				if (value.typeref === 'forests') {
					angular.forEach(value.relation, function(forest) {
						forests.push(forest.nameref);
					});
				}

			});
			forests.sort();
			return forests;
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

		function groupForestsByHosts() {
			
			$scope.$watch('forestsOnHosts', function () {
		//	console.log("forestsOnHosts ======= " + JSON.stringify($scope.forestsOnHosts));
				//console.log('watching now...');
				options.annotations = [];
				// group the forests on same host using annotations
				annotateForests($scope.forestsOnHosts);
				
			}, true);

		}


function pushForestsToChart (forestsonhosts) {
	angular.forEach(forestsonhosts, function(forests, host) {
		angular.forEach(forests, function(forest) {
			var index = $scope.myResource1.indexOf(forest);
			// push each ItemConfig object into items array
					items.push(
						new primitives.orgdiagram.ItemConfig({
							id: index + 1,
							parent: 0,
							title: forest,
							description: host,
							image: "scripts/demo/images/photos/f.png",
							itemTitleColor: primitives.common.Colors.Green,
							groupTitleColor: primitives.common.Colors.Black,
							groupTitle: host
						})
					);
		});
	});

	annotateForests($scope.myResource4);
}


function pushForestsToChart2 (forests) {
	angular.forEach(forests, function(forest) {
		var index = $scope.myResource1.indexOf(forest);
		// push each ItemConfig object into items array
					items.push(
						new primitives.orgdiagram.ItemConfig({
							id: index + 1,
							parent: 0,
							title: forest,
							description: 'host',
							image: "scripts/demo/images/photos/f.png",
							itemTitleColor: primitives.common.Colors.Green,
							groupTitleColor: primitives.common.Colors.Black,
							groupTitle: 'host'
						})
					);	
	});
	annotateForests($scope.myResource4);
}

		
		function annotateForests(hostforests) {
			console.log('hostforests == ', hostforests);
			angular.forEach(hostforests, function(forests, key) {
				if (forests.length > 1) {
					options.annotations.push({
						annotationType: primitives.common.AnnotationType.Shape,
						// get item ids of forests to annotate
						items: function() {
							var indexArr = [];
							for (var i = 0; i < forests.length; i++) {
								for (var j = 0; j < items.length; j++) {
									if (items[j].title === forests[i]) {
										indexArr.push(items[j].id);
										break;
									}
								}
							}
							console.log(indexArr);
							indexArr.sort();
							return indexArr;
						}.call(),
						label: key,
						labelSize: new primitives.common.Size(100, 100),
						labelPlacement: primitives.common.PlacementType.Bottom,
						shapeType: primitives.common.ShapeType.SingleLine,
						borderColor: primitives.common.Colors.Red,
						offset: {
							left: 2,
							top: 2,
							right: 2,
							bottom: 2
						},
						lineWidth: 2,
						selectItems: true,
						lineType: primitives.common.LineType.Dashed
					})
				}
			//	console.log("annotation length = " + options.annotations.length);

			});
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
		//	console.log("cluster = " + clusters);
			return clusters;
		}

		
	}]);


app.directive('ngChart', function() {
	return {
		link: function(scope, element, attrs) {
			var chart = null;

			scope.$watch(attrs.ngModel, function(options) {
				if (!chart) {
					chart = jQuery(element).orgDiagram(scope[attrs.ngModel]);
				} else {
					chart.orgDiagram(scope[attrs.ngModel]);
					chart.orgDiagram("update", primitives.orgdiagram.UpdateMode.Refresh);
				}
			}, true);
		}
	};
});
