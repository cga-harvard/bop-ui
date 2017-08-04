/*eslint angular/no-services: [2,{"directive":["$http","$q"],"controller":["$resource"]}]*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,110]*/
/**
 * Main Controller
 */
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('DataConf', function () {
        return { solrHeatmapApp: false };
    })
    .controller('MainController',
                ['DataConf', 'Map', 'HeatMapSourceGenerator', '$http', '$scope', '$location',
                    '$rootScope', '$stateParams', 'searchFilter',
        function(DataConf, Map, HeatMapSourceGenerator, $http, $scope, $location,
                 $rootScope, $stateParams, searchFilter) {
            var MapService = Map;
            var HeatMapSourceGeneratorService = HeatMapSourceGenerator;
            var mapIsMoved = false;
            var isBackbuttonPressed = false;
            // var isThereInteraction = false;

            var vm = this;
            vm.$state = $stateParams;
            vm.isThereInteraction = false;

            vm.setupEvents = function() {
                MapService.getMap().getView().on('change:center', function(evt){
                    mapIsMoved = !mapIsMoved ? true : false;
                });
                MapService.getMap().getView()
                    .on('change:resolution', function(evt){
                        vm.isThereInteraction = true;
                    });
                MapService.getMap().on('moveend', function(evt){
                    if ((mapIsMoved || searchFilter.geo === '[-90,-180 TO 90,180]') && !isBackbuttonPressed) {
                        vm.isThereInteraction = true;
                        changeGeoSearch();
                        mapIsMoved = false;
                    }else if(!isBackbuttonPressed){
                        vm.isThereInteraction = true;
                        mapIsMoved = false;
                        changeGeoSearch(false);
                    }else {
                        isBackbuttonPressed = false;
                        HeatMapSourceGeneratorService.search();
                    }
                });

                var locationChangeEventBroadcast = $rootScope.$on('$locationChangeSuccess', function() {
                    if (!vm.isThereInteraction) {
                        isBackbuttonPressed = true;
                        var extent = BOP.queryService.
                            getExtentForProjectionFromQuery(
                                $location.search().geo, DataConf.solrHeatmapApp.initMapConf.view.projection);
                        MapService.getMap().getView().fit(extent, MapService.getMapSize());
                    }
                    vm.isThereInteraction = false;
                });

                function changeGeoSearch(changeUrl) {
                    changeUrl = angular.isUndefined(changeUrl) || changeUrl ? true : false;
                    MapService.checkBoxOfTransformInteraction();
                    var currentExtent = MapService.getCurrentExtentQuery();
                    searchFilter.setFilter({geo: currentExtent.geo, hm: currentExtent.hm });
                    HeatMapSourceGeneratorService.search(changeUrl);
                }
            };

            vm.response = function(response) {
                var data = response ? response.data : undefined;
                if (data && data.mapConfig) {
                    var mapConf = data.mapConfig,
                        appConf = data.appConfig,
                        bopwsConfig = data.bopwsConfig,
                        instructions = data.instructions;

                    if(DataConf.solrHeatmapApp.$state.geo) {
                        mapConf.view.initExtent = mapConf.view.extent;
                        mapConf.view.extent = BOP.queryService.
                          getExtentForProjectionFromQuery(DataConf.solrHeatmapApp.$state.geo,
                                                          mapConf.view.projection);
                        mapConf.view.extent = MapService
                            .calculateFullScreenExtentFromBoundingBox(mapConf.view.extent);
                    }
                    MapService.init({
                        mapConfig: mapConf
                    });
                    DataConf.solrHeatmapApp.appConfig = appConf;
                    DataConf.solrHeatmapApp.initMapConf = mapConf;
                    DataConf.solrHeatmapApp.bopwsConfig = bopwsConfig;
                    DataConf.solrHeatmapApp.instructions = instructions;

                    // fire event mapReady
                    $rootScope.$broadcast('mapReady', MapService.getMap());

                    DataConf.solrHeatmapApp.setupEvents();

                } else {
                    throw new Error('Could not find the mapConfig');
                }
            };
            vm.badResponse = function(data) {
                throw new Error('Error while loading the config.json');
            };

            DataConf.solrHeatmapApp = vm;

            //  get the app config
            $http.get('./config/appConfig.json')
                .then(DataConf.solrHeatmapApp.response, DataConf.solrHeatmapApp.badResponse);
        }]
);
})();
