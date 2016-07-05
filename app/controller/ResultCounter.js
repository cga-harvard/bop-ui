/*eslint angular/di: [2,"array"]*/
/*eslint angular/controller-as: 0*/
/**
 * ResultCounter Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ResultCounterController', ['$scope', function($scope) {

        $scope.$on('setCounter', function(e, data){
            if (data < 1) {
                data = "No results found";
            }
            $scope.counter = data;
        });
    }]);
