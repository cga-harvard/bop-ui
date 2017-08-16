/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,100]*/
/**
 * Map service
 */
(function() {
    angular.module('SolrHeatmapApp')
    .factory('Map',
             ['$rootScope', 'DataConf', '$window',
        function($rootScope, DataConf, $window) {

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

            function updateTransformationLayerFromQueryForMap(query) {
                const extent = BOP.queryService.
                    getExtentForProjectionFromQuery(query, map.helpers.getMapProjection());
                setTransactionBBox(extent);
            }

            function setTransactionBBox(extent) {
                const transformationLayer = map.helpers.getLayersBy('name',
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
                const mapExtent = map.getView().calculateExtent(map.helpers.getMapSize());

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
                    const vw = map.getView();
                    vw.setCenter(intitalCenter);
                    vw.setZoom(intitalZoom);
                    checkBoxOfTransformInteraction();
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
                resetMap,
                checkBoxOfTransformInteraction,
                calculateFullScreenExtentFromBoundingBox,
                updateTransformationLayerFromQueryForMap,
                getMap
            };
            return service;
        }]
);
})();
