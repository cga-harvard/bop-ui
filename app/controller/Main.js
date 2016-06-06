/**
 * Main Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('mainCtrl', ['Map', 'HeatMapSourceGenerator' , '$http', '$scope', '$rootScope', function(MapService, HeatMapSourceGeneratorService, $http, $scope, $rootScope) {
        solrHeatmapApp = this;

       //  get the app config
        $http.get('./config/appConfig.json').
            success(function(data, status, headers, config) {
                if (data && data.mapConfig) {
                    var mapConf = data.mapConfig,
                        appConf = data.appConfig;
                    // create the map with the given config
                    MapService.init({
                        mapConfig: mapConf
                    });
                    solrHeatmapApp.appConfig = appConf;
                    solrHeatmapApp.initMapConf = mapConf;
                    // set the map to access it at runtime (for debugging only)
                    solrHeatmapApp.map = MapService.getMap();
                    // fire event mapReady
                    $rootScope.$broadcast('mapReady', MapService.getMap());

                    solrHeatmapApp.map.on('moveend', function(evt){
                      HeatMapSourceGeneratorService.performSearch();
                    });

                    solrHeatmapApp.map.getView().on('change:resolution', function(evt){
                      var existingHeatMapLayers = MapService.getLayersBy('name', 'HeatMapLayer');
                      if (existingHeatMapLayers && existingHeatMapLayers.length > 0){
                        var radius = 500 * evt.target.getResolution();
                        var hmLayer = existingHeatMapLayers[0];
                        if (radius > 15) {
                          radius = 15;
                        }
                        hmLayer.setRadius(radius);
                        hmLayer.setBlur(radius*2);
                      }
                    });

                  // Prepared featureInfo (display number of elements)
                  //solrHeatmapApp.map.on('singleclick', MapService.displayFeatureInfo);

                } else {
                    throw 'Could not find the mapConfig';
                }
            }).
            error(function(data, status, headers, config) {
                throw 'Error while loading the config.json';
            });
    }]);
