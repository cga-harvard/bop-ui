/**
 *
 */
import heatmap from './heatmap';
import mapHelpers from './mapHelpers';

export default function initMap(config, defaults) {
    const viewConfig = Object.assign(defaults.view, config.mapConfig.view);
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
        renderer: typeof rendererConfig === 'string' ?
                                rendererConfig : undefined,
        target: 'map',

        view: new ol.View({
            center: Array.isArray(viewConfig.center) ?
                    viewConfig.center : undefined,
            maxZoom: typeof viewConfig.maxZoom === 'number' ?
                    viewConfig.maxZoom : undefined,
            minZoom: typeof viewConfig.minZoom === 'number' ?
                    viewConfig.minZoom : undefined,
            projection: typeof viewConfig.projection === 'string' ?
                    viewConfig.projection : undefined,
            resolution: typeof viewConfig.resolution === 'string' ?
                    viewConfig.resolution : undefined,
            resolutions: Array.isArray(viewConfig.resolutions) ?
                    viewConfig.resolutions : undefined,
            rotation: typeof viewConfig.rotation === 'number' ?
                    viewConfig.rotation : undefined,
            zoom: typeof viewConfig.zoom === 'number' ?
                    viewConfig.zoom : undefined,
            zoomFactor: typeof viewConfig.zoomFactor === 'number' ?
                    viewConfig.zoomFactor : undefined
        })
    });

    const olGM = new olgm.OLGoogleMaps({map: map}); // map is the ol.Map instance
    olGM.activate();

    map.helpers = mapHelpers(map);
    map.heatmap = heatmap(map);
    zoomToTheMask(map, viewConfig);
    setMapTooltip(map)

    return map;
}

function zoomToTheMask(map, viewConfig) {
    if (Array.isArray(viewConfig.extent)) {
        const vw = map.getView();
        vw.set('extent', viewConfig.extent);
        generateMaskAndAssociatedInteraction(map, viewConfig.extent, viewConfig.projection);

        if (viewConfig.initExtent) {
            vw.fit(viewConfig.extent, map.getSize());
        }
    }
}

function setMapTooltip(map) {
    const tooltip = window.document.getElementById('tooltip');
    const overlay = new ol.Overlay({
        element: tooltip,
        offset: [10, 0],
        positioning: 'bottom-left'
    });
    map.addOverlay(overlay);

    map.on('pointermove', evt => displayTooltip(evt, map, overlay, tooltip));
}

function displayTooltip(evt, map, overlay, tooltip) {
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

    if (Array.isArray(layerConfig)) {
        layerConfig.forEach(conf => {
            let layer;

            if (conf.type === 'googleLayer') {
                layer = new olgm.layer.Google({
                    name: 'googleTerrain',
                    backgroundLayer: conf.visible,
                    mapTypeId: google.maps.MapTypeId.TERRAIN
                });
            }
            if (conf.type === 'Toner') {
                layer = new ol.layer.Tile({
                    name: 'toner',
                    source: new ol.source.Stamen({
                        layer: 'toner-lite'
                    }),
                    backgroundLayer: conf.backgroundLayer,
                    visible: conf.visible
                });
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
function generateMaskAndAssociatedInteraction(map, bboxFeature, fromSrs) {
    let polygon = new ol.Feature(ol.geom.Polygon.fromExtent(bboxFeature));
    const projection = map.helpers.getMapProjection();
    if (fromSrs !== projection){
        const polygonNew = ol.proj.transformExtent(bboxFeature, fromSrs, projection);
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
    map.addLayer(vector);
    vector.getSource().addFeature(polygon);
}
