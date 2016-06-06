/**
 * Search Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('Search', ['Map', 'HeatMapSourceGenerator', '$scope', '$http', function(MapService, HeatMapSourceGeneratorService, $scope, $http) {

        /**
         *
         */
        $scope.searchInput = '';
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
            if ($scope.searchInput.length === 0) {
               return false;
          }

          HeatMapSourceGeneratorService.setSearchText($scope.searchInput);
          HeatMapSourceGeneratorService.performSearch();
        };

        $scope.resetSearchInput = function() {
          $scope.searchInput = '';
          HeatMapSourceGeneratorService.setSearchText('');
          HeatMapSourceGeneratorService.performSearch();
        };

        /**
         *
         */
        function getKeyboardCodeFromEvent(keyEvt) {
            return window.event ? keyEvt.keyCode : keyEvt.which;
        }

    }]);
