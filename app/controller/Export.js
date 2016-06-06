/**
 * Toolbar Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('Export', ['Map', '$scope', '$filter', '$timeout', function(MapService, $scope, $filter, $timeout) {

        $scope.startExport = function() {
          console.log("Here will be an awesome export");
        };

    }]);
