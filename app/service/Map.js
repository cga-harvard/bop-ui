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

            const service = {};
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
            service.getMap = () => map;

            service.getMapView = () => service.getMap().getView();

            service.getMapZoom = () => service.getMapView().getZoom();

            service.getMapSize = () => service.getMap().getSize();

            service.getMapProjection = () => {
                return service.getMapView().getProjection().getCode();
            };

            service.getLayers = () => service.getMap().getLayers().getArray();

            service.getLayersBy = (key, value) => {
                const layers = service.getLayers();
                return layers.filter(layer => {
                    return layer.get(key) === value;
                });
            };

            service.updateTransformationLayerFromQueryForMap = query => {
                const extent = BOP.queryService.
                    getExtentForProjectionFromQuery(query,
                                                    service.getMapProjection());
                setTransactionBBox(extent);
            };

            function fillNullValueToEmptyArray(heatmap) {
                return heatmap.map(row => {
                    return row === null ? [] : row;
                });
            }

            function rescaleHeatmapValue(value, minMaxValue){
                if (value === null){
                    return 0;
                }

                if (value === -1){
                    return -1;
                }

                if (value === 0){
                    return 0;
                }

                if ((minMaxValue[1] - minMaxValue[0]) === 0){
                    return 0;
                }
                const scaledValue = (value - minMaxValue[0]) / (minMaxValue[1] - minMaxValue[0]);
                return scaledValue;
            }

            function getClassifications(hmParams) {
                const flattenCount = [];
                hmParams.counts_ints2D.forEach(row => {
                    row = row === null ? [] : row;
                    flattenCount.push(...row);
                });

                const series = new geostats(flattenCount);
                const gradientLength = hmParams.gradientArray.length;
                const numberOfClassifications = gradientLength - Math.ceil(gradientLength*0.4);
                return series.getClassJenks(numberOfClassifications);
            }

            function closestValue(arrayOfValues, value) {
                //it makes sure that nothing above zero is assigned to the zero bin.
                if (value === 0) {
                    return 0;
                }
                let currentValue = arrayOfValues[0];
                let currIndex = 1;
                for (let i = 1; i < arrayOfValues.length; i++) {
                    if (Math.abs(value - arrayOfValues[i]) < Math.abs(value - currentValue)) {
                        currentValue = arrayOfValues[i];
                        currIndex = i;
                    }
                }
                return currIndex;
            }

            /*
             *
             */
            function createHeatMapSource(hmParams) {
                if (!hmParams.counts_ints2D) {
                    return null;
                }
                const counts_ints2D = fillNullValueToEmptyArray(hmParams.counts_ints2D);
                const gridColumns = hmParams.columns;
                const gridRows = hmParams.rows;
                const minX = hmParams.minX;
                const minY = hmParams.minY;
                const maxX = hmParams.maxX;
                const maxY = hmParams.maxY;
                const hmProjection = hmParams.projection;
                const units = hmParams.posSent ? '%' : null;
                const dx = maxX - minX;
                const dy = maxY - minY;
                const sx = dx / gridColumns;
                const sy = dy / gridRows;
                const olFeatures = [];
                const classifications = getClassifications(hmParams);
                const minMaxValue = [0, classifications.length - 1];

                for (let i = 0 ; i < gridRows ; i++){
                    for (let j = 0 ; j < gridColumns ; j++){
                        let hmVal = counts_ints2D[counts_ints2D.length-i-1][j],
                            lon,
                            lat,
                            feat,
                            coords;

                        if (hmVal && hmVal !== null){
                            lat = minY + i*sy + (0.5 * sy);
                            lon = minX + j*sx + (0.5 * sx);
                            coords = ol.proj.transform(
                                [lon, lat],
                                hmProjection,
                                map.getView().getProjection().getCode()
                            );

                            let classifiedValue = closestValue(classifications, hmVal);
                            let scaledValue = rescaleHeatmapValue(classifiedValue, minMaxValue);

                            feat = new ol.Feature({
                                name: hmVal,
                                units: units,
                                scaledValue: scaledValue,
                                geometry: new ol.geom.Point(coords),
                                opacity: 1,
                                weight: 1
                            });

                            feat.set('weight', scaledValue);
                            feat.set('origVal', hmVal);

                            olFeatures.push(feat);
                        }
                    }
                }

                const olVecSrc = new ol.source.Vector({
                    features: olFeatures,
                    useSpatialIndex: true
                });
                return olVecSrc;
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

            service.createOrUpdateHeatMapLayer = hmData => {
                // Hardcode linear color gradient
                const sentimetGradient = ["hsl(400, 100%, 50%)", "hsl(399, 100%, 50%)",
                    "hsl(396, 100%, 50%)", "hsl(393, 100%, 50%)", "hsl(390, 100%, 50%)",
                    "hsl(385, 100%, 50%)", "hsl(380, 100%, 50%)", "hsl(360, 100%, 50%)",
                    "hsl(340, 100%, 50%)", "hsl(300, 100%, 50%)",
                    "hsl(260, 100%, 50%)", "hsl(200, 100%, 50%)"];
                const normalCountGradient = generateSigmoidColorGradient(330, 0);
                const existingHeatMapLayers = service.getLayersBy('name', 'HeatMapLayer');
                const transformInteractionLayer = service.getLayersBy('name',
                                                                "TransformInteractionLayer")[0];

                hmData.heatmapRadius = 20;
                hmData.blur = 12;
                hmData.gradientArray = hmData.posSent ? sentimetGradient : normalCountGradient;

                const olVecSrc = createHeatMapSource(hmData);

                if (existingHeatMapLayers && existingHeatMapLayers.length > 0){
                    const currHeatmapLayer = existingHeatMapLayers[0];
                    // Update layer source
                    const layerSrc = currHeatmapLayer.getSource();
                    if (layerSrc){
                        layerSrc.clear();
                    }
                    currHeatmapLayer.setSource(olVecSrc);
                    currHeatmapLayer.setGradient(hmData.gradientArray);
                } else {
                    const newHeatMapLayer = new ol.layer.Heatmap({
                        name: 'HeatMapLayer',
                        source: olVecSrc,
                        radius: hmData.heatmapRadius,
                        blur: hmData.blur,
                        gradient: hmData.gradientArray
                    });

                    try {
                        service.getMap().addLayer(newHeatMapLayer);
                    } catch(err) {
                        void 0;
                    }

                }
            };

            /**
            * This function distributes the color gradients using the sigmoid function,
                distributing the colors to disperse the middle classes of the center
            * The HEX was replaced with the HSL color model, this allows to generate and
                array of colors that changes only the hue and maintains saturation and luminosity.
            **/
            function generateSigmoidColorGradient(maxHue=300, minHue=0) {
                const normalCountGradient = [];
                const NumberPartition = 12;
                const delta = (maxHue-minHue);
                for (let i = -NumberPartition/2; i < NumberPartition/2; i++) {
                    let hue = sigmoid(i)*delta + minHue;
                    let hsl = 'hsl(' + hue + ', 100%, 50%)';
                    normalCountGradient.push(hsl);
                }
                return normalCountGradient.reverse();
            }
            function sigmoid(x) {
                return 1/(1 + Math.pow(Math.E, -x));
            }

            /**
             * This method adds a transfrom interaction to the mapand a mask to background layer
             * The area outer the feature which can be modified by the transfrom interaction
             * will have a white shadow
             */
            function generateMaskAndAssociatedInteraction(bboxFeature, fromSrs) {
                let polygon = new ol.Feature(ol.geom.Polygon.fromExtent(bboxFeature));
                let backGroundLayer = service.getLayersBy('backgroundLayer', true)[0];

                if (fromSrs !== service.getMapProjection()){
                    const polygonNew = ol.proj.transformExtent(bboxFeature, fromSrs,
                                                    service.getMapProjection());
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
                service.getMap().addLayer(vector);
                vector.getSource().addFeature(polygon);
            }

            function setTransactionBBox(extent) {
                const transformationLayer = service.getLayersBy('name',
                                                              'TransformInteractionLayer')[0];
                const vectorSrc = transformationLayer.getSource();
                const currentBbox = vectorSrc.getFeatures()[0];
                const polyNew = ol.geom.Polygon.fromExtent(extent);
                currentBbox.setGeometry(polyNew);
            }

            service.calculateReducedBoundingBoxFromInFullScreen = extent => {
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
            };

            service.calculateFullScreenExtentFromBoundingBox = extent => {
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
            };

            /*
             * For change:resolution event (zoom in map):
             * If bounding of transform interaction is grater than the map extent
             * the transform box will be resized to
             * DataConf.solrHeatmapApp.appConfig.ratioInnerBbox percent
             */
            service.checkBoxOfTransformInteraction = () => {
                const mapExtent = service.getMapView().calculateExtent(service.getMapSize());

                // calculate reduced bounding box
                const reducedBoundingBox = service.calculateReducedBoundingBoxFromInFullScreen({
                    minX: mapExtent[0], minY: mapExtent[1],
                    maxX: mapExtent[2], maxY: mapExtent[3]
                });

                setTransactionBBox([reducedBoundingBox.minX, reducedBoundingBox.minY,
                    reducedBoundingBox.maxX, reducedBoundingBox.maxY]);
            };

            /**
             * Helper method to reset the map
             */
            service.resetMap = () => {
                // Reset view
                const intitalCenter = DataConf.solrHeatmapApp.initMapConf.view.center;
                const intitalZoom = DataConf.solrHeatmapApp.initMapConf.view.zoom;
                if (intitalZoom && intitalCenter) {
                    const vw = service.getMapView();
                    vw.setCenter(intitalCenter);
                    vw.setZoom(intitalZoom);
                    service.checkBoxOfTransformInteraction();
                }
            };

            service.getReducedQueryFromExtent = extentQuery => {
                const extent = BOP.queryService.getExtentFromQuery(extentQuery);
                return BOP.queryService.
                    createQueryFromExtent(
                        service.calculateReducedBoundingBoxFromInFullScreen(extent));
            };

            service.getCurrentExtentQuery = () => {
                const currentExtent = service.getCurrentExtent();
                return {
                    geo: BOP.queryService.createQueryFromExtent(currentExtent.geo),
                    hm: BOP.queryService.createQueryFromExtent(currentExtent.hm)
                };
            };

            service.createExtentFromNormalize = normalizedExtent => {
                return {
                    minX: normalizedExtent[0],
                    minY: normalizedExtent[1],
                    maxX: normalizedExtent[2],
                    maxY: normalizedExtent[3]
                };
            };

            /**
             * Builds geospatial filter depending on the current map extent.
             * This filter will be used later for `q.geo` parameter of the API
             * search or export request.
             */
            service.getCurrentExtent = () => {
                const viewProj = service.getMapProjection();
                const extent = service.getMapView().calculateExtent(service.getMapSize());
                const transformInteractionLayer = service.
                                    getLayersBy('name', 'TransformInteractionLayer')[0];
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
                if (service.getMapZoom() <= 1) {
                    extentWgs84 = [-180, -90 ,180, 90];
                }

                if (extent && extentWgs84){
                    const normalizedExtentMap = BOP.normalizeExtent(extentWgs84);
                    const normalizedExtentBox = BOP.normalizeExtent(currentBboxExtentWgs84);

                    currentExtent = service.createExtentFromNormalize(normalizedExtentMap);

                    currentExtentBox = service.createExtentFromNormalize(normalizedExtentBox);

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

            service.removeAllfeatures = () => {
                if (angular.isObject(map)) {
                    const layersWithBbox = service.getLayersBy('isbbox', true);
                    layersWithBbox[0].getSource().clear();
                }
            };

            service.addCircle = (point, style) => {

                const geojsonObject = {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": ol.proj.fromLonLat(point)}
                };

                if (angular.isObject(map) && Object.keys(map).length !== 0) {
                    const layersWithBbox = service.getLayersBy('isbbox', true);
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
            };

            service.toggleBaseMaps = () => {
                service.googleLayer.setVisible(!service.googleLayer.getVisible());
                service.tonerLayer.setVisible(!service.tonerLayer.getVisible());
            };

            /**
             *
             */
            service.init = config => {
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
                        vw.fit(viewConfig.extent, service.getMapSize());
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
            return service;
        }]
);
})();
