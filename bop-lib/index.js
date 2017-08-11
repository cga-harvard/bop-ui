import normalizeExtent from './Normalize';
import { queryService } from './queryService';
import HeightModule from './heightModule';
import compactInteger from './numberService';
import { dateTimeService } from './dateTimeService';
import heatmap from './map/heatmap';

(function(window) {

    window.BOP = {
        normalizeExtent,
        queryService,
        compactInteger,
        dateTimeService,
        heatmap,
        HeightModule: HeightModule(window)
    };

})(window);
