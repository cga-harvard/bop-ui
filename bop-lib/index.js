import normalizeExtent from './Normalize';
import { queryService } from './queryService';
import HeightModule from './heightModule';
import compactInteger from './numberService';
import { dateTimeService } from './dateTimeService';
import initMap from './map/map';

(function(window) {

    window.BOP = {
        normalizeExtent,
        queryService,
        compactInteger,
        dateTimeService,
        initMap,
        HeightModule: HeightModule(window)
    };

})(window);
