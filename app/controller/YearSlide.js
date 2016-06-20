/**
 * YearSlide Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('YearSlideCtrl', ['Map', 'HeatMapSourceGenerator', '$scope', '$filter', '$timeout', function(MapService, HeatMapSourceGeneratorService, $scope, $filter, $timeout) {

        $scope.ys = {
          years : {
            min: HeatMapSourceGeneratorService.getSearchObj().yearMin,
            max: HeatMapSourceGeneratorService.getSearchObj().yearMax,
            options: {
              floor: 2005,
              ceil: 2016,
              noSwitching: true
              //showTicks: true
            }
          }
        };

        $scope.$on("slideEnded", function() {
            var newMin = $scope.ys.years.min,
                newMax = $scope.ys.years.max;

             HeatMapSourceGeneratorService.setMinYear(newMin);
             HeatMapSourceGeneratorService.setMaxYear(newMax);
             HeatMapSourceGeneratorService.performSearch();
        });

    }]);
