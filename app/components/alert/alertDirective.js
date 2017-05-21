/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Export Directive
 */
(function() {
    angular
    .module('search_alert_component', [])
    .directive('alert', ['$rootScope', function($rootScope) {
        return {
            link: link,
            restrict: 'EA',
            templateUrl: 'components/alert/alert.tpl.html',
            scope: {}
        };

        function link(scope) {
            scope.message = '';
            // set the message when the solrHeatmapApp was assigned
            var mapReady = $rootScope.$on('mapReady', function(event, _) {
                scope.message = solrHeatmapApp.appConfig.alertMsg;
            });

        }
    }]);
})();
