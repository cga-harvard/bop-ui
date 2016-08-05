/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/**
 * Geospatial filter Controller
 */
(function() {
angular
    .module('SolrHeatmapApp')
    .controller('GeospatialFilterController', ['$scope', '$uibModal',
        function($scope, $uibModal) {

            $scope.filterString = '[-90,-180 TO 90,180]';

            $scope.showInfo = function(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.
                                            geospatialsearch.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.
                                            geospatialsearch.toolTitle;
                        }
                    }
                });
            };

            $scope.updateFilterString = function(str) {
                $scope.filterString = str;
            };
        }]
);
})();
