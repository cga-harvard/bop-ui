/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,100]*/
/**
 * Map service
 */
(function() {
    angular.module('SolrHeatmapApp')
    .factory('Map', ['DataConf', function(DataConf) {
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
                map.helpers.checkBoxOfTransformInteraction(DataConf.solrHeatmapApp.appConfig);
            }
        }

        function toggleBaseMaps() {
            const googleLayer = map.helpers.getLayersBy('name', 'googleTerrain')[0];
            const tonerLayer = map.helpers.getLayersBy('name', 'toner')[0]
            googleLayer.setVisible(!googleLayer.getVisible());
            tonerLayer.setVisible(!tonerLayer.getVisible());
        }

        return {
            init,
            toggleBaseMaps,
            resetMap,
            getMap
        };
    }]
);
})();
