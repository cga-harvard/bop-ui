

/**
 *
 */
function initMap(config) {
    const viewConfig = angular.extend(defaults.view, config.mapConfig.view);
    const rendererConfig = config.mapConfig.renderer ?
            config.mapConfig.renderer : defaults.renderer;
    const layerConfig = config.mapConfig.layers;

    const map = new ol.Map({
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
    return map;
};

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
