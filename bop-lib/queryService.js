/*eslint max-len: [2,100]*/
import normalizeExtent from './Normalize';

export const queryService = {
    createQueryFromExtent,
    getExtentFromQuery,
    getExtentForProjectionFromQuery
};

function createQueryFromExtent(extent) {
    return `[${extent.minY},${extent.minX} TO ${extent.maxY},${extent.maxX}]`;
}

function getExtentFromQuery(query) {
    const extent = query.replace(/\[|\]/g,'').split(' TO ');
    const min = extent[0].split(',');
    const max = extent[1].split(',');
    return {
        minX: parseInt(min[0], 10),
        minY: parseInt(min[1], 10),
        maxX: parseInt(max[0], 10),
        maxY: parseInt(max[1], 10)
    };
}

function getExtentForProjectionFromQuery(query, projection) {
    const extentObj = getExtentFromQuery(query);
    const extent = normalizeExtent([
        extentObj.minY,
        extentObj.minX,
        extentObj.maxY,
        extentObj.maxX]);
    return ol.proj.transformExtent(extent, 'EPSG:4326', projection);
}
