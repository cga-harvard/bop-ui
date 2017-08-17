import normalizeExtent from '../Normalize';
import { queryService } from '../queryService';
import HeightModule from '../heightModule';



export default function mapHelpers(map){
    return {
        getMapZoom,
        getMapSize,
        getMapProjection,
        getLayers,
        getLayersBy,
        getCurrentExtent,
        createExtentFromNormalize,
        getCurrentExtentQuery,
        addCircle,
        removeAllBboxfeatures,
        updateTransformationLayerFromQueryForMap,
        checkBoxOfTransformInteraction,
        calculateFullScreenExtentFromBoundingBox
    }

    function getMapZoom(){
        return map.getView().getZoom();
    }

    function getMapSize(){
        return map.getSize();
    }

    function getMapProjection(){
        return map.getView().getProjection().getCode();
    };

    function getLayers() {
        return map.getLayers().getArray();
    }

    function getLayersBy(key, value) {
        const layers = getLayers();
        return layers.filter(layer => {
            return layer.get(key) === value;
        });
    };


    /**
     * Builds geospatial filter depending on the current map extent.
     * This filter will be used later for `q.geo` parameter of the API
     * search or export request.
     */
    function getCurrentExtent() {
        const viewProj = getMapProjection();
        const extent = map.getView().calculateExtent(getMapSize());
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
            const normalizedExtentMap = normalizeExtent(extentWgs84);
            const normalizedExtentBox = normalizeExtent(currentBboxExtentWgs84);
            currentExtent = createExtentFromNormalize(normalizedExtentMap);
            currentExtentBox = createExtentFromNormalize(normalizedExtentBox);
        }

        return { hm: currentExtent, geo: currentExtentBox };
    };

    function createExtentFromNormalize(normalizedExtent) {
        return {
            minX: normalizedExtent[0],
            minY: normalizedExtent[1],
            maxX: normalizedExtent[2],
            maxY: normalizedExtent[3]
        };
    }

    function getCurrentExtentQuery() {
        const currentExtent = getCurrentExtent();
        return {
            geo: queryService.createQueryFromExtent(currentExtent.geo),
            hm: queryService.createQueryFromExtent(currentExtent.hm)
        };
    }

    function addCircle(point, style) {

        const geojsonObject = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": ol.proj.fromLonLat(point)}
        };

        if (isNotEmptyObject(map)) {
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

        function isNotEmptyObject(obj) {
            return obj !== null && typeof obj === 'object' && Object.keys(obj).length !== 0;
        }
    }

    function removeAllBboxfeatures() {
        if (map !== null && typeof map === 'object') {
            const layersWithBbox = getLayersBy('isbbox', true);
            layersWithBbox[0].getSource().clear();
        }
    }

    function updateTransformationLayerFromQueryForMap(query) {
        const extent = queryService.
            getExtentForProjectionFromQuery(query, getMapProjection());
        setTransactionBBox(extent);
    }

    // private
    function setTransactionBBox(extent) {
        const transformationLayer = getLayersBy('name', 'TransformInteractionLayer')[0];
        const vectorSrc = transformationLayer.getSource();
        const currentBbox = vectorSrc.getFeatures()[0];
        const polyNew = ol.geom.Polygon.fromExtent(extent);
        currentBbox.setGeometry(polyNew);
    }

    /*
     * For change:resolution event (zoom in map):
     * If bounding of transform interaction is grater than the map extent
     * the transform box will be resized to
     * DataConf.solrHeatmapApp.appConfig.ratioInnerBbox percent
     */
    function checkBoxOfTransformInteraction(isConfig) {
        const mapExtent = map.getView().calculateExtent(getMapSize());
        if (!isConfig) { return setTransactionBBox(mapExtent); }

        // calculate reduced bounding box
        const reducedBoundingBox = calculateReducedBoundingBoxFromInFullScreen({
            minX: mapExtent[0], minY: mapExtent[1],
            maxX: mapExtent[2], maxY: mapExtent[3]
        });
        setTransactionBBox([reducedBoundingBox.minX, reducedBoundingBox.minY,
            reducedBoundingBox.maxX, reducedBoundingBox.maxY]);
    }

    // private
    function calculateReducedBoundingBoxFromInFullScreen(extent){
        const screenDimensions = HeightModule(window);
        const sideBarPercent = 1 - (screenDimensions.sideBarWidth()/window.innerWidth);
        const rightSideBarWidth = 1 - (screenDimensions.rightSideBarWidth/window.innerWidth);
        const bottomHeight = 1 - (screenDimensions.bottomHeight/window.innerWidth);
        const topBarPercent = 1 -
            (screenDimensions.topPanelHeight()/screenDimensions.documentHeight());
        const dx = extent.maxX - extent.minX;
        const dy = extent.maxY - extent.minY;
        const minX = extent.minX + (1 - sideBarPercent) * dx;
        const maxX = extent.minX + (rightSideBarWidth) * dx;
        const minY = extent.minY + (1 - bottomHeight) * dy;
        const maxY = extent.minY + (topBarPercent) * dy;
        return {minX, minY, maxX, maxY};
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

}
