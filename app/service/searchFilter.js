/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('searchFilter', ['Map', 'HeightModule', function(Map, HeightModule){
        var MapService = Map;
        var service = {
            geo: '[-90,-180 TO 90,180]',
            hm: '[-90,-180 TO 90,180]',
            time: null,
            text: null,
            user: null,
            textLimit: null,
            userLimit: null,
            numOfDocs: 50,
            minDate: new Date(moment().subtract(2, 'months').format('YYYY-MM-DD')),
            maxDate: new Date(moment().format('YYYY-MM-DD'))
        };

        var emptyStringForNull = function(value) {
            return value === null ? '' : value;
        };
        service.setFilter = function(filter) {
            if(filter.time) {
                service.time = filter.time;
            }
            if(filter.user) {
                service.user = filter.user;
            }
            if(filter.text) {
                service.text = filter.text;
            }
            if(filter.geo) {
                service.geo = filter.geo;
            }
            if (filter.hm) {
                service.hm = filter.hm;
            }
        };

        service.resetFilter = function() {
            service.time = null;
            service.text = null;
            service.user = null;
            service.geo = MapService.getCurrentExtentQuery().geo;
            service.textLimit = null;
        };

        return service;
    }]);
})();
