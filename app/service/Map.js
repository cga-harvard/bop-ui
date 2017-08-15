/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,100]*/
/**
 * Map service
 */
(function() {
    angular.module('SolrHeatmapApp')
    .factory('Map',
             ['$rootScope', 'DataConf', '$filter', '$document', '$controller',
              '$window',
        function($rootScope, DataConf, $filter, $document, $controller,
            $window) {

            const defaults = {
                renderer: 'canvas',
                view: {
                    center: [0 ,0],
                    projection: 'EPSG:3857',
                    zoom: 2
                }
            };
            let map = {};

            function init(config) {
                map = BOP.initMap(config, defaults);
            }

            /**
            *
            */
            function getMap() {
                return map;
            }

            function getMapView(){
                return getMap().getView();
            }

            function getMapZoom(){
                return getMapView().getZoom();
            }

            function getMapSize(){
                return getMap().getSize();
            }

            function getMapProjection(){
                return getMapView().getProjection().getCode();
            };

            function getLayers() {
                return getMap().getLayers().getArray();
            }

            function getLayersBy(key, value) {
                const layers = getLayers();
                return layers.filter(layer => {
                    return layer.get(key) === value;
                });
            };

            function updateTransformationLayerFromQueryForMap(query) {
                const extent = BOP.queryService.
                    getExtentForProjectionFromQuery(query, getMapProjection());
                setTransactionBBox(extent);
            }

            function setTransactionBBox(extent) {
                const transformationLayer = getLayersBy('name',
                                                              'TransformInteractionLayer')[0];
                const vectorSrc = transformationLayer.getSource();
                const currentBbox = vectorSrc.getFeatures()[0];
                const polyNew = ol.geom.Polygon.fromExtent(extent);
                currentBbox.setGeometry(polyNew);
            }

            function calculateReducedBoundingBoxFromInFullScreen(extent){
                const sideBarPercent = 1 - (BOP.HeightModule.sideBarWidth()/$window.innerWidth);
                const rightSideBarWidth = 1 - (BOP.HeightModule.rightSideBarWidth/$window.innerWidth);
                const bottomHeight = 1 - (BOP.HeightModule.bottomHeight/$window.innerWidth);
                const topBarPercent = 1 -
                    (BOP.HeightModule.topPanelHeight()/BOP.HeightModule.documentHeight());
                if(DataConf.solrHeatmapApp.appConfig) {
                    const dx = extent.maxX - extent.minX;
                    const dy = extent.maxY - extent.minY;
                    const minX = extent.minX + (1 - sideBarPercent) * dx;
                    const maxX = extent.minX + (rightSideBarWidth) * dx;
                    const minY = extent.minY + (1 - bottomHeight) * dy;
                    const maxY = extent.minY + (topBarPercent) * dy;
                    return {minX, minY, maxX, maxY};
                }
                return extent;
            }

            function calculateFullScreenExtentFromBoundingBox(extent) {
                extent = {
                    minX: extent[0], minY: extent[1],
                    maxX: extent[2], maxY: extent[3]
                };
                const sideBarPercent = 1 - (BOP.HeightModule.sideBarWidth()/$window.innerWidth);
                const topBarPercent = 1 -
                    (BOP.HeightModule.topPanelHeight()/BOP.HeightModule.documentHeight());

                const dx = extent.maxX - extent.minX;
                const dy = extent.maxY - extent.minY;
                const minX = extent.minX + dx - (dx/sideBarPercent);
                const maxY = extent.minY + dy/topBarPercent;
                return [minX, extent.minY, extent.maxX, maxY];
            }

            /*
             * For change:resolution event (zoom in map):
             * If bounding of transform interaction is grater than the map extent
             * the transform box will be resized to
             * DataConf.solrHeatmapApp.appConfig.ratioInnerBbox percent
             */
            function checkBoxOfTransformInteraction() {
                const mapExtent = getMapView().calculateExtent(getMapSize());

                // calculate reduced bounding box
                const reducedBoundingBox = calculateReducedBoundingBoxFromInFullScreen({
                    minX: mapExtent[0], minY: mapExtent[1],
                    maxX: mapExtent[2], maxY: mapExtent[3]
                });

                setTransactionBBox([reducedBoundingBox.minX, reducedBoundingBox.minY,
                    reducedBoundingBox.maxX, reducedBoundingBox.maxY]);
            }

            /**
             * Helper method to reset the map
             */
            function resetMap() {
                // Reset view
                const intitalCenter = DataConf.solrHeatmapApp.initMapConf.view.center;
                const intitalZoom = DataConf.solrHeatmapApp.initMapConf.view.zoom;
                if (intitalZoom && intitalCenter) {
                    const vw = getMapView();
                    vw.setCenter(intitalCenter);
                    vw.setZoom(intitalZoom);
                    checkBoxOfTransformInteraction();
                }
            }

            function getCurrentExtentQuery() {
                const currentExtent = getCurrentExtent();
                return {
                    geo: BOP.queryService.createQueryFromExtent(currentExtent.geo),
                    hm: BOP.queryService.createQueryFromExtent(currentExtent.hm)
                };
            }

            function createExtentFromNormalize(normalizedExtent) {
                return {
                    minX: normalizedExtent[0],
                    minY: normalizedExtent[1],
                    maxX: normalizedExtent[2],
                    maxY: normalizedExtent[3]
                };
            }

            /**
             * Builds geospatial filter depending on the current map extent.
             * This filter will be used later for `q.geo` parameter of the API
             * search or export request.
             */
            function getCurrentExtent() {
                const viewProj = getMapProjection();
                const extent = getMapView().calculateExtent(getMapSize());
                const transformInteractionLayer = getLayersBy('name', 'TransformInteractionLayer')[0];
                let extentWgs84 = ol.proj.transformExtent(extent, viewProj, 'EPSG:4326');
                let currentExtent = {};
                let currentExtentBox = {};

                if (!transformInteractionLayer) {
                    return null;
                }
                const currentBbox = transformInteractionLayer.getSource().getFeatures()[0];
                const currentBboxExtentWgs84 = ol.proj.transformExtent(
                                currentBbox.getGeometry().getExtent(), viewProj, 'EPSG:4326');

                // default: Zoom level <= 1 query whole world
                if (getMapZoom() <= 1) {
                    extentWgs84 = [-180, -90 ,180, 90];
                }

                if (extent && extentWgs84){
                    const normalizedExtentMap = BOP.normalizeExtent(extentWgs84);
                    const normalizedExtentBox = BOP.normalizeExtent(currentBboxExtentWgs84);

                    currentExtent = createExtentFromNormalize(normalizedExtentMap);

                    currentExtentBox = createExtentFromNormalize(normalizedExtentBox);

                    const roundToFixed = value => {
                        return parseFloat(Math.round(value* 100) / 100).toFixed(2);
                    };
                    // Reset the date fields
                    $rootScope.$broadcast('geoFilterUpdated',
                                                    `[${roundToFixed(currentExtentBox.minX)},
                                                    ${roundToFixed(currentExtentBox.minY)} TO
                                                    ${roundToFixed(currentExtentBox.maxX)},
                                                    ${roundToFixed(currentExtentBox.maxY)}]`);
                }

                return { hm: currentExtent, geo: currentExtentBox };
            };

            function removeAllfeatures() {
                if (angular.isObject(map)) {
                    const layersWithBbox = getLayersBy('isbbox', true);
                    layersWithBbox[0].getSource().clear();
                }
            }

            function addCircle(point, style) {

                const geojsonObject = {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": ol.proj.fromLonLat(point)}
                };

                if (angular.isObject(map) && Object.keys(map).length !== 0) {
                    const layersWithBbox = getLayersBy('isbbox', true);
                    const features = (new ol.format.GeoJSON).readFeatures(geojsonObject);

                    if (layersWithBbox.length) {
                        layersWithBbox[0].getSource().addFeatures(features);
                    }else{
                        const vectorLayer = new ol.layer.Vector({
                            isbbox: true,
                            source: new ol.source.Vector({
                                features: features
                            })
                        });
                        vectorLayer.setStyle(style);
                        map.addLayer(vectorLayer);
                    }

                }
            }

            function toggleBaseMaps() {
                const googleLayer = map.helpers.getLayersBy('name', 'googleTerrain')[0];
                const tonerLayer = map.helpers.getLayersBy('name', 'toner')[0]
                googleLayer.setVisible(!googleLayer.getVisible());
                tonerLayer.setVisible(!tonerLayer.getVisible());
            }

            const service = {
                init,
                toggleBaseMaps,
                addCircle,
                removeAllfeatures,
                getCurrentExtent,
                createExtentFromNormalize,
                getCurrentExtentQuery,
                resetMap,
                checkBoxOfTransformInteraction,
                calculateFullScreenExtentFromBoundingBox,
                updateTransformationLayerFromQueryForMap,

                getMap,
                getMapView,
                getMapZoom,
                getMapSize,
                getMapProjection,
                getLayers,
                getLayersBy
            };
            return service;
        }]
);
})();
