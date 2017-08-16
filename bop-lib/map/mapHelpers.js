import normalizeExtent from '../Normalize';
import { queryService } from '../queryService';


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
        removeAllfeatures
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

    function removeAllfeatures() {
        if (map !== null && typeof map === 'object') {
            const layersWithBbox = getLayersBy('isbbox', true);
            layersWithBbox[0].getSource().clear();
        }
    }



}
