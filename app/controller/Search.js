/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,120]*/
/**
 * Search Controller
 */
(function() {
    angular.module('SolrHeatmapApp')
    .controller('SearchController', ['Map', 'HeatMapSourceGenerator', '$scope', '$uibModal', '$controller', '$window',
        function(Map, HeatMapSourceGenerator, $scope, $uibModal, $controller, $window) {
            var MapService = Map,
                HeatMapSourceGeneratorService = HeatMapSourceGenerator;
            /**
             *
             */
            $scope.searchInput = '';

            /**
             *
             */
            function getKeyboardCodeFromEvent(keyEvt) {
                return $window.event ? keyEvt.keyCode : keyEvt.which;
            }

            /**
             *
             */
            $scope.onKeyPress = function($event) {
                // only fire the search if Enter-key (13) is pressed
                if (getKeyboardCodeFromEvent($event) === 13) {
                    $scope.doSearch();
                }
            };

            /**
             *
             */
            $scope.doSearch = function() {
                // if no input is given
                // if ($scope.searchInput.length === 0) {
                //    return false;
                // }
                HeatMapSourceGeneratorService.search($scope.searchInput);

            };

            $scope.resetSearchInput = function() {
                $scope.searchInput = '';
                HeatMapSourceGeneratorService.search($scope.searchInput);

                // Reset the map
                MapService.resetMap();

                //ToDo: Reset date fields
                // DatePickerController does not exist anymore
            };

            $scope.showInfo = function(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.textsearch.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.textsearch.toolTitle;
                        }
                    }
                });
            };

        }]
);
})();
