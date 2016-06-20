/**
 * ResultCounter Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ResultCounterCtrl', ['$scope', function($scope) {

        $scope.$on('setCounter', function(e, data){
          if (data < 1) {
              data = "No results found";
          }
            $scope.counter = data;
        })
    }]);
