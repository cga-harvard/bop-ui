/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('queryService', ['Normalize', function(Normalize){

        const service = {};

        service.createQueryFromExtent = extent => {
            return `[${extent.minY},${extent.minX} TO ${extent.maxY},${extent.maxX}]`;
        };

        service.getExtentFromQuery = query => {
            const extent = query.replace(/\[|\]/g,'').split(' TO ');
            const min = extent[0].split(',');
            const max = extent[1].split(',');
            return {
                minX: parseInt(min[0], 10),
                minY: parseInt(min[1], 10),
                maxX: parseInt(max[0], 10),
                maxY: parseInt(max[1], 10)
            };
        };

        service.getExtentForProjectionFromQuery = (query, projection) => {
            const extentObj = service.getExtentFromQuery(query);
            const extent = Normalize.normalizeExtent([
                extentObj.minY,
                extentObj.minX,
                extentObj.maxY,
                extentObj.maxX]);
            return ol.proj.transformExtent(extent, 'EPSG:4326', projection);
        };

        return service;
    }]);
})();
