import normalizeExtent from './Normalize';
import { queryService } from './queryService';
import HeightModule from './heightModule';
import compactInteger from './numberService';

(function(window) {

    window.BOP = {
        normalizeExtent,
        queryService,
        compactInteger,
        HeightModule: HeightModule(window)
    };

})(window);
