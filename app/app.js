/**
 * The main solrHeatmapApp module
 */
(function() {
    angular.module('SolrHeatmapApp', [
        'templates-components',
        'ui.bootstrap',
        'rzModule',
        'search_components',
        'ui.router'
    ]);
    angular.module('SolrHeatmapApp')
    .config(function($locationProvider, $stateProvider, $urlRouterProvider) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
        $urlRouterProvider.otherwise('/');
        $stateProvider.state({
            name: 'root',
            url: '/?time&geo&text&user',
            resolve: {
                search: function($stateParams,HeatMapSourceGenerator,searchFilter) {
                    searchFilter.setFilter($stateParams);
                }
            }
        }).state({
            name: 'search',
            url: '/search?time&geo&text&user',
            resolve: {
                search: function($stateParams,HeatMapSourceGenerator,searchFilter) {
                    searchFilter.setFilter($stateParams);
                }
            }
        });
    });
})();
