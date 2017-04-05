/*eslint angular/di: [2,"array"]*/
/*eslint angular/controller-as: 0*/
/**
 * ResultCounter Controller
 */

(function() {
    angular
    .module('search_heatmap_component', [])
    .directive('heatmap', [function() {
        return {
            restrict: 'EA',
            templateUrl: 'components/heatmap/heatmap.tpl.html',
            scope: {}
        };
    }])
    .directive('heatmapButton', ['searchFilter', 'HeatMapSourceGenerator',
    function(searchFilter, HeatMapSourceGenerator) {
        return {
            link: link,
            template: '<button class="btn btn-default from-panel" type="button" ' +
                'ng-click="toggleHeatmap()">{{buttonName}}</button>',
            scope: {}
        };
        function link(scope) {
            var vm = scope;
            vm.buttonName = 'SENTIMENT HEATMAP';
            vm.toggleHeatmap = function() {
                var heatmapSentiment = !searchFilter.posSent;
                vm.buttonName = heatmapSentiment ? 'TWEETS HEATMAP' : 'SENTIMENT HEATMAP';
                searchFilter.setFilter({
                    posSent: heatmapSentiment
                });
                HeatMapSourceGenerator.search();
            };
        }
    }]);



})();
