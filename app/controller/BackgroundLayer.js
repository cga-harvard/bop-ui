/**
 * LayerPanel Service
 */
angular
    .module('SolrHeatmapApp')
    .controller('BackgroundLayer', ['Map', '$scope', function(MapService, $scope) {

        /**
         *
         */
        $scope.layers = {};
        $scope.selectedLayer = {};

        /**
         *
         */
        $scope.$on('mapReady', function(event, map) {
            $scope.layers = map.getLayers().getArray();
            $scope.selectedLayer = {
                name: $scope.getBackgroundLayers()[0].get('name')
            };
        });

        /**
         *
         */
        $scope.isBackgroundLayer = function(layer) {
            var isBackgroundLayer = false;
            if (layer.get('backgroundLayer')) {
                isBackgroundLayer = true;
            }
            return isBackgroundLayer;
        };

        /**
         *
         */
        $scope.setBackgroundLayer = function(layer) {
            angular.forEach($scope.getBackgroundLayers(), function(bgLayer) {
                if (bgLayer === layer) {
                    layer.setVisible(true);
                    $scope.selectedLayer = {name: layer.get('name')};
                } else {
                    bgLayer.setVisible(false);
                }
            });
        };

        /**
         *
         */
        $scope.getBackgroundLayers = function() {
            var layers = MapService.getMap().getLayers().getArray();

            return layers.filter(function(l) {
                if (l.get('backgroundLayer')) {
                    return true;
                } else {
                    return false;
                }
            });
        };

    }]);
