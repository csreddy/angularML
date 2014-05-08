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

	}

});

app.controller('ChartCtrl', ['$scope',  'DataService',
	function($scope, DataService) {
		$scope.a = "Test";
		var items = [];
		var annotations = [];
		var options = new primitives.orgdiagram.Config();
		$scope.db = "MyDatabase";
		$scope.forestHosts = [];
		$scope.forestsOnHosts = {};
		$scope.init = function() {
			var url = '/manage/v2/databases/' + $scope.db + '?format=json';

			DataService.getDBResponse($scope.db).then(function(dataResponse) {
				// this callback will be called asynchronously
				$scope.response = dataResponse.data || {};
				$scope.appserver = getAttachedAppServer($scope.response) || [];
				$scope.forests = getAttachedForests($scope.response) || {};
				console.log($scope.appserver);

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

				// show appserver(s) if exists
				angular.forEach($scope.appserver, function(appserver, key) {
					items.push(
						new primitives.orgdiagram.ItemConfig({
							id: 10, //items.length + $scope.appserver.indexOf(appserver) + 1,
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

				pushForestIntoChart($scope.forests, function () {
					console.log("callback invoked!");
					groupForestsByHosts($scope.forestsOnHosts);
				});
			//	console.warn(JSON.stringify($scope.forestsOnHosts))
			//	groupForestsByHosts($scope.forestsOnHosts);
		

				

				options.items = items;
				//      options.cursorItem = 0;
				//   options.hasSelectorCheckbox = primitives.common.Enabled.True;

				$scope.options = options;

				$scope.setCursorItem = function(cursorItem) {
					$scope.options.cursorItem = cursorItem;
				};



			});



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

		function getAttachedForests(response) {
			var forests = [];
			var relGroup = response['database-default']['relations']['relation-group'];
			angular.forEach(relGroup, function(value, key) {
				if (value.typeref === 'forests') {
					angular.forEach(value.relation, function(forest, key) {
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
			angular.forEach(relGroup, function(value, key) {
				if (value.typeref === 'hosts') {
					angular.forEach(value.relation, function(host, key) {
						forestHost = host.nameref;
					});
				}
			});
			return forestHost;
		}
		
		function groupForestsByHosts(forestsOnHosts) {
			// group the forests on same host using annotations
			angular.forEach(forestsOnHosts, function(forests, key) {
				if (forests.length > 1) {
					console.log("inside----------");
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
				console.log("ann length = " + options.annotations.length);

			});
		}

		function pushForestIntoChart(forests, callback) {
			// loop through each forest details & get its host name
			angular.forEach(forests, function(forest, key) {
				//	  console.log("key before = " + (key+1));
				//	  console.log(forest);
				DataService.getForestResponse(forest).then(function(dataResponse) {
					var index = $scope.forests.indexOf(forest);
					//	  console.log("index = " + (index + 1));
					var host = getForestHost(dataResponse.data);

					if ($scope.forestHosts.indexOf(host) === -1) {
						$scope.forestHosts.push(host);
					}

					if ($scope.forestHosts.length > 1) $scope.forestHosts.sort();

					// push each ItemConfig object into items array
					console.log(JSON.stringify($scope.forestsOnHosts));
					//	  console.log($scope.forestHosts);
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

					// sort the items based on their id
					items.sort(function(a, b) {
						if (a.id > b.id) return 1;
						if (a.id < b.id) return -1;
						return 0;
					});


					// get json showing host & forests key values
					$scope.forestsOnHosts[host] = function() {
						if ($scope.forestsOnHosts[host] === undefined || $scope.forestsOnHosts[host] === null) {
							console.log(JSON.stringify($scope.forestsOnHosts[host]));
							return new Array(forest);
						} else {
							console.log(JSON.stringify($scope.forestsOnHosts[host]));
							var arr = $scope.forestsOnHosts[host];
							arr.push(forest);
							return arr.sort();
						}
					}.call();

					//	console.log(items);			
					console.log("forestsOnHosts = " + JSON.stringify($scope.forestsOnHosts));
					
					// group the forests on same host using annotations
				//	groupForestsByHosts($scope.forestsOnHosts)
				});
				
			});

			console.log("inside pushForestIntoChart");
			console.log("oustide forestsOnHosts = " + JSON.stringify($scope.forestsOnHosts));
			if(typeof callback == "function") 
			        callback();
		}


	}
]);


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
