/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/**
 * Geospatial filter Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('GeospatialFilterController', ['$scope', '$uibModal',
        function($scope, $uibModal) {

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
        }]
);
