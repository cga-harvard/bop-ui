/**
 * Export Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ExportCtrl', ['HeatMapSourceGenerator', '$scope', function(HeatMapSourceGeneratorService, $scope) {

        $scope.startExport = function() {
          HeatMapSourceGeneratorService.startCsvExport();
        };
    }]);
