/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/**
 * Geospatial filter Directive
 */
(function() {
    angular
    .module('search_geospatialFilter_component', [])
    .directive('geospatialFilter', ['InfoService', function(InfoService) {
        return {
            link: GeospatialFilterLink,
            restrict: 'EA',
            templateUrl: 'components/geospatialFilter/geospatialFilter.tpl.html',
            scope: {}
        };

        function GeospatialFilterLink(scope) {

            scope.filterString = '[-90,-180 TO 90,180]';

            scope.showGeospatialInfo = function() {
                InfoService.showInfoPopup('geospatialsearch');
            };

            scope.$on('geoFilterUpdated', function(event, filter) {
                scope.filterString = filter;
            });

            scope.updateFilterString = function(str) {
                scope.filterString = str;
            };

        }
    }]);
})();
