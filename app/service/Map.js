/**
 * Map Service
 */
angular
    .module('SolrHeatmapApp')
    .factory('Map', ['$rootScope', '$filter', '$http', function($rootScope, $filter, $http) {

        var map = {},
            defaults = {
                renderer: 'canvas',
                view: {
                    center: [0, 0],
                    projection: 'EPSG:3857',
                    zoom: 14
                }
            };

        var ms = {
            //map: map,
            init: init,
            getMap: getMap,
            getTransformedCenterCoords: getTransformedCenterCoords,
            getLayersBy: getLayersBy,
            getInteractionsByClass: getInteractionsByClass,
            getInteractionsByType: getInteractionsByType,
            displayFeatureInfo: displayFeatureInfo,
            createOrUpdateHeatMapLayer: createOrUpdateHeatMapLayer,
            createHeatMapSource: createHeatMapSource,
            heatmapMinMax: heatmapMinMax,
            rescaleHeatmapValue: rescaleHeatmapValue
        };

        return ms;

        /**
         *
         */
        function init(config) {
            var viewConfig = angular.extend(defaults.view, config.mapConfig.view),
                // TODO overwrite with default if not set
                rendererConfig = config.mapConfig.renderer,
                layerConfig = config.mapConfig.layers;

            map = new ol.Map({
                controls: ol.control.defaults().extend([
                    new ol.control.ScaleLine(),
                    new ol.control.ZoomSlider()
                ]),
                interactions: ol.interaction.defaults(),
                layers: buildMapLayers(layerConfig),
                renderer: angular.isString(rendererConfig) ? rendererConfig :
                    undefined,
                target: 'map',
                view: new ol.View({
                    center: getTransformedCenterCoords(viewConfig.center,
                            viewConfig.projection),
                    maxResolution: angular.isNumber(viewConfig.maxResolution) ?
                            viewConfig.maxResolution : undefined,
                    minResolution: angular.isNumber(viewConfig.minResolution) ?
                            viewConfig.minResolution : undefined,
                    maxZoom: angular.isNumber(viewConfig.maxZoom) ?
                            viewConfig.maxZoom : undefined,
                    minZoom: angular.isNumber(viewConfig.minZoom) ?
                            viewConfig.minZoom : undefined,
                    projection: angular.isString(viewConfig.projection) ?
                            viewConfig.projection : undefined,
                    resolution: angular.isString(viewConfig.resolution) ?
                            viewConfig.resolution : undefined,
                    resolutions: angular.isArray(viewConfig.resolutions) ?
                            viewConfig.resolutions : undefined,
                    rotation: angular.isNumber(viewConfig.rotation) ?
                            viewConfig.rotation : undefined,
                    zoom: angular.isNumber(viewConfig.zoom) ?
                            viewConfig.zoom : undefined,
                    zoomFactor: angular.isNumber(viewConfig.zoomFactor) ?
                            viewConfig.zoomFactor : undefined,
                })
            });

        }

        /**
         *
         */
        function getTransformedCenterCoords(center, projection) {
            var centerNew;
            if (angular.isArray(center) &&
                    angular.isString(projection)) {
                centerNew = ol.proj.transform(center, 'EPSG:4326', projection);
            }
            return centerNew;
        }

        /**
         *
         */
        function buildMapLayers(layerConfig) {
            var layer,
                layers = [];

            if (angular.isArray(layerConfig)) {
                angular.forEach(layerConfig, function(conf) {
                    if (conf.type === 'TileWMS') {
                        layer = new ol.layer.Tile({
                            name: conf.name,
                            backgroundLayer: conf.backgroundLayer,
                            displayInLayerPanel: conf.displayInLayerPanel,
                            source: new ol.source.TileWMS({
                                attributions: [new ol.Attribution({
                                    html: conf.attribution
                                })],
                                crossOrigin: conf.crossOrigin,
                                logo: conf.logo,
                                params: conf.params,
                                ratio: conf.ratio,
                                resolutions: conf.resoltions,
                                url: conf.url,
                            }),
                            opacity: conf.opacity,
                            visible: conf.visible
                        });
                    }
                    if (conf.type === 'ImageWMS') {
                        layer = new ol.layer.Image({
                            name: conf.name,
                            backgroundLayer: conf.backgroundLayer,
                            displayInLayerPanel: conf.displayInLayerPanel,
                            source: new ol.source.ImageWMS({
                                attributions: [new ol.Attribution({
                                    html: conf.attribution
                                })],
                                crossOrigin: conf.crossOrigin,
                                logo: conf.logo,
                                params: conf.params,
                                resolutions: conf.resoltions,
                                url: conf.url,
                            }),
                            opacity: conf.opacity,
                            visible: conf.visible
                        });
                    }
                    layers.push(layer);
                });
            }
            return layers;
        }

        /**
         *
         */
        function getLayersBy(key, value) {
            var layers = solrHeatmapApp.map.getLayers().getArray();
            return $filter('filter')(layers, function(layer) {
                return layer.get(key) === value;
            });
        }

        /**
         *
         */
        function getInteractionsByClass(value) {
            var interactions = solrHeatmapApp.map.getInteractions().getArray();
            return $filter('filter')(interactions, function(interaction) {
                return interaction instanceof value;
            });
        }

        /**
         *
         */
        function getInteractionsByType(interactions, type) {
            return $filter('filter')(interactions, function(interaction) {
                return interaction.type_ === type;
            });
        }

        /**
         *
         */
        function getMap() {
            return map;
        }

        /**
         *
         */
        function displayFeatureInfo(evt) {
            var coord = evt.coordinate,
                feature = map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                    return feature;
                }),
                msg = '',
                evtCnt = 0,
                lyrCnt = 0;

            // the popup element
            var container = document.getElementById('popup');
            var content = document.getElementById('popup-content');
            var closer = document.getElementById('popup-closer');

            closer.onclick = function() {
                overlay.setPosition(undefined);
                closer.blur();
                return false;
            };

            // create an overlay
            var overlay = new ol.Overlay({
                element: container,
                autoPan: true,
                autoPanAnimation: {
                  duration: 250
                }
            });

            // remove any existing overlay before adding a new one
            map.getOverlays().clear();
            map.addOverlay(overlay);

            if (feature) {
              var data = feature.get('origVal');
              if (data) {
                   $rootScope.$broadcast('featureInfoLoaded', data);
              }
            }

            $rootScope.$on('featureInfoLoaded', function(evt, data) {
               msg += '<h5>Number of elements: </h5>' + data;
               content.innerHTML = msg;
               var overlay = solrHeatmapApp.map.getOverlays().getArray()[0];
               if (overlay) {
                 overlay.setPosition(coord);
               }
           });

        }

        function createOrUpdateHeatMapLayer(data) {
          var olVecSrc = this.createHeatMapSource(data),
              existingHeatMapLayers = this.getLayersBy('name', 'HeatMapLayer'),
              newHeatMapLayer;
          if (existingHeatMapLayers && existingHeatMapLayers.length > 0){
              var currHeatmapLayer = existingHeatMapLayers[0];
              // Update layer source
              var layerSrc = currHeatmapLayer.getSource();
              if (layerSrc){
                layerSrc.clear();
                currHeatmapLayer.setSource(olVecSrc);
              }
          } else {
            newHeatMapLayer = new ol.layer.Heatmap({
             name: 'HeatMapLayer',
             source: olVecSrc,
             radius: 10,
             opacity: 0.25
           });
            map.addLayer(newHeatMapLayer);
          }
        }

        /*
         *
         */
        function createHeatMapSource(data) {
          if (data && data.response) {
          //  console.log("Number of found examples: ", data.response.numFound);
            var counts_ints2D = data.facet_counts.facet_heatmaps.bbox[15],
                gridLevel = data.facet_counts.facet_heatmaps.bbox[1],
                gridColumns = data.facet_counts.facet_heatmaps.bbox[3],
                gridRows = data.facet_counts.facet_heatmaps.bbox[5],
                minX = data.facet_counts.facet_heatmaps.bbox[7],
                minY = data.facet_counts.facet_heatmaps.bbox[11],
                maxX = data.facet_counts.facet_heatmaps.bbox[9],
                maxY = data.facet_counts.facet_heatmaps.bbox[13],
                dx = maxX - minX,
                dy = maxY - minY,
                sx = dx / gridColumns,
                sy = dy / gridRows,
                olFeatures = [],
                map = this.getMap(),
                minMaxValue,
                sumOfAllVals = 0;

            if (!counts_ints2D) {
              return null;
            }
            minMaxValue = this.heatmapMinMax(counts_ints2D, gridRows, gridColumns);

            for (var i = 0 ; i < gridRows ; i++){
              for (var j = 0 ; j < gridColumns ; j++){
                  var hmVal = counts_ints2D[counts_ints2D.length - i - 1][j],
                      lon,
                      lat,
                      feat,
                      coords;

                  if (hmVal && hmVal !== null){
                    lat = minY + i*sy + (0.5 * sy);
                    lon = minX + j*sx + (0.5 * sx);

                    coords = ol.proj.transform(
                      [lon, lat],
                      'EPSG:4326',
                      map.getView().getProjection().getCode()
                    );

                    feat = new ol.Feature({
                      geometry: new ol.geom.Point(coords)
                    });

                    // needs to be rescaled.
                    var scaledValue = this.rescaleHeatmapValue(hmVal, minMaxValue);
                    feat.set('weight',  scaledValue);
                    feat.set('origVal', hmVal);

                    olFeatures.push(feat);
                  }
              }
            }

            olVecSrc = new ol.source.Vector({
              features: olFeatures,
              useSpatialIndex: true
            });
            return olVecSrc;
          }
        }

        function heatmapMinMax(heatmap, stepsLatitude, stepsLongitude){
          var max = -1;
          var min = Number.MAX_VALUE;
          for (var i = 0 ; i < stepsLatitude ; i++){
            var currentRow = heatmap[i];
            if (currentRow === null){
              heatmap[i] = currentRow = [];
            }
            for (var j = 0 ; j < stepsLongitude ; j++){
              if (currentRow[j] === null){
                currentRow[j] = -1;
              }

              if (currentRow[j] > max){
                max = currentRow[j];
              }

              if (currentRow[j] < min && currentRow[j] > -1){
                min = currentRow[j];
              }
            }
          }
          return [min, max];
        }

        function rescaleHeatmapValue(value, minMaxValue){
          if (value === null){
            return 0;
          }

          if (value == -1){
            return -1;
          }

          if (value === 0){
            return 0;
          }

          if ((minMaxValue[1] - minMaxValue[0]) === 0){
            return 0;
          }

          return (value - minMaxValue[0]) / (minMaxValue[1] - minMaxValue[0]) ;
        }

    }]);
