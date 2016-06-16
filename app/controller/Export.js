/**
 * Export Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ExportCtrl', ['Map', '$scope', '$filter', '$timeout', function(MapService, $scope, $filter, $timeout) {

        $scope.startExport = function() {
          console.log("Here will be an awesome export");
        };

    }]);
