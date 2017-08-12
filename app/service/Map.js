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

            /**
             *
             */
            function buildMapLayers(layerConfig) {
                const layers = [];
                let layer;

                if (angular.isArray(layerConfig)) {

                    angular.forEach(layerConfig, conf => {
                        if (conf.type === 'googleLayer') {
                            service.googleLayer = new olgm.layer.Google({
                                backgroundLayer: conf.visible,
                                mapTypeId: google.maps.MapTypeId.TERRAIN
                            });
                            layer = service.googleLayer;
                        }
                        if (conf.type === 'Toner') {
                            service.tonerLayer = new ol.layer.Tile({
                                source: new ol.source.Stamen({
                                    layer: 'toner-lite'
                                }),
                                backgroundLayer: conf.backgroundLayer,
                                visible: conf.visible
                            });
                            layer = service.tonerLayer;
                        }
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
                                    url: conf.url
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
                                    url: conf.url
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

            function displayTooltip(evt, overlay, tooltip) {
                const pixel = evt.pixel;
                const feature = map.forEachFeatureAtPixel(pixel, feat => feat);

                const name = feature ? feature.get('name') + feature.get('units') : undefined;
                tooltip.style.display = name ? '' : 'none';
                if (name) {
                    overlay.setPosition(evt.coordinate);
                    tooltip.innerHTML = name;
                }
            }

            /**
             * This method adds a transfrom interaction to the mapand a mask to background layer
             * The area outer the feature which can be modified by the transfrom interaction
             * will have a white shadow
             */
            function generateMaskAndAssociatedInteraction(bboxFeature, fromSrs) {
                let polygon = new ol.Feature(ol.geom.Polygon.fromExtent(bboxFeature));
                let backGroundLayer = getLayersBy('backgroundLayer', true)[0];

                if (fromSrs !== getMapProjection()){
                    const polygonNew = ol.proj.transformExtent(bboxFeature, fromSrs,
                                                    getMapProjection());
                    polygon = new ol.Feature(ol.geom.Polygon.fromExtent(polygonNew));
                }

                // TransformInteractionLayer
                // holds the value of q.geo
                const vector = new ol.layer.Vector({
                    name: 'TransformInteractionLayer',
                    source: new ol.source.Vector(),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [255,255,255,0]
                        }),
                        stroke: new ol.style.Stroke({
                            color: [0,0,0,0],
                            width: 0
                        })
                    })
                });
                getMap().addLayer(vector);
                vector.getSource().addFeature(polygon);
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
                service.googleLayer.setVisible(!service.googleLayer.getVisible());
                service.tonerLayer.setVisible(!service.tonerLayer.getVisible());
            }

            /**
             *
             */
            function init(config) {
                const viewConfig = angular.extend(defaults.view, config.mapConfig.view);
                const rendererConfig = config.mapConfig.renderer ?
                        config.mapConfig.renderer : defaults.renderer;
                const layerConfig = config.mapConfig.layers;

                map = new ol.Map({
                    // use OL3-Google-Maps recommended default interactions
                    interactions: olgm.interaction.defaults(),
                    controls: ol.control.defaults().extend([
                        new ol.control.ScaleLine(),
                        new ol.control.ZoomSlider()
                    ]),
                    layers: buildMapLayers(layerConfig),
                    renderer: angular.isString(rendererConfig) ?
                                            rendererConfig : undefined,
                    target: 'map',

                    view: new ol.View({
                        center: angular.isArray(viewConfig.center) ?
                                viewConfig.center : undefined,
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
                                viewConfig.zoomFactor : undefined
                    })
                });

                const olGM = new olgm.OLGoogleMaps({map: map}); // map is the ol.Map instance
                olGM.activate();

                if (angular.isArray(viewConfig.extent)) {
                    const vw = map.getView();
                    vw.set('extent', viewConfig.extent);
                    generateMaskAndAssociatedInteraction(viewConfig.extent, viewConfig.projection);

                    if (viewConfig.initExtent) {
                        vw.fit(viewConfig.extent, getMapSize());
                    }
                }

                const tooltip = $window.document.getElementById('tooltip');
                const overlay = new ol.Overlay({
                    element: tooltip,
                    offset: [10, 0],
                    positioning: 'bottom-left'
                });
                map.addOverlay(overlay);

                map.on('pointermove', evt => displayTooltip(evt, overlay, tooltip));
            };

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
