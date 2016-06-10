/**
 * Toolbar Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ResultCounter', ['Map', 'HeatMapSourceGenerator', '$scope', '$filter', '$timeout', function(MapService, HeatMapSourceGeneratorService, $scope, $filter, $timeout) {

        $scope.$on('setCounter', function(e, data){
          if (data < 0) {
              data = "No results found";
          }
            $scope.counter = data;
        })
    }]);
