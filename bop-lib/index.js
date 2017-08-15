import normalizeExtent from './Normalize';
import { queryService } from './queryService';
import HeightModule from './heightModule';
import compactInteger from './numberService';
import { dateTimeService } from './dateTimeService';
import initMap from './map/map';
import heatmap from './map/heatmap';

(function(window) {

    window.BOP = {
        normalizeExtent,
        queryService,
        compactInteger,
        dateTimeService,
        heatmap,
        initMap,
        HeightModule: HeightModule(window)
    };

})(window);
