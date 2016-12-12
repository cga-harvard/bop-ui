/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Export Directive
 */
(function() {
    angular
    .module('search_resetButton_component', [])
    .directive('resetButton', ['HeatMapSourceGenerator', 'searchFilter', 'Map',
        function(HeatMapSourceGenerator, searchFilter, Map) {
            return {
                link: ExportLink,
                restrict: 'EA',
                templateUrl: 'components/resetButton/resetButton.tpl.html',
                scope: {}
            };

            function ExportLink(scope) {
                var vm = scope;
                vm.basemaps = 'OSM basemap';

                vm.reset = function reset() {
                    // Reset the map
                    Map.resetMap();
                    searchFilter.resetFilter();
                    HeatMapSourceGenerator.search();
                };

                vm.toggleBaseMaps = function() {
                    vm.basemaps = vm.basemaps === 'OSM basemap' ?
                        'Google Terrain' : 'OSM basemap';
                    Map.toggleBaseMaps();
                };
            }
        }]);
})();
