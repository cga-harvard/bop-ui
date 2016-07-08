/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/**
 * Export Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ExportController', ['HeatMapSourceGenerator', '$scope',
        function(HeatMapSourceGeneratorService, $scope) {

            $scope.startExport = function() {
                HeatMapSourceGeneratorService.startCsvExport();
            };
        }]

);
