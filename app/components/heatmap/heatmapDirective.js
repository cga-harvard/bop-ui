/*eslint angular/di: [2,"array"]*/
/*eslint angular/controller-as: 0*/
/**
 * ResultCounter Controller
 */

(function() {
    angular
    .module('search_heatmap_component', [])
    .directive('heatmap', heatmap);

    function heatmap() {
        return {
            link: ResultCounterLink,
            restrict: 'EA',
            templateUrl: 'components/heatmap/heatmap.tpl.html',
            scope: {}
        };

        function ResultCounterLink(scope) {
            scope.$on('setCounter', function(e, data){
                if (data < 1 || !data) {
                    data = 'No results found';
                }
                scope.counter = data;
            });
        }
    }
})();
