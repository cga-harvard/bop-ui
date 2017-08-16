/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('searchFilter', ['Map', function(Map){
        const MapService = Map;
        const service = {
            geo: '[-90,-180 TO 90,180]',
            hm: '[-90,-180 TO 90,180]',
            time: null,
            text: null,
            user: null,
            textLimit: null,
            userLimit: null,
            numOfDocs: 50,
            gap: 'P1W',
            posSent: false,
            minDate: new Date(moment().subtract(3, 'months').format('YYYY-MM-DD')),
            maxDate: new Date(moment().format('YYYY-MM-DD'))
        };

        const emptyStringForNull = value => value === null ? '' : value;

        service.setFilter = filter => {
            if(filter.time) {
                service.time = filter.time;
                service.gap = BOP.dateTimeService.getGapFromTimeString(filter.time);
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
            if (angular.isDefined(filter.posSent)) {
                service.posSent = filter.posSent;
            }
        };

        service.resetFilter = () => {
            service.time = BOP.dateTimeService.formatDatesToString(service.minDate, service.maxDate);
            service.text = null;
            service.user = null;
            service.geo = MapService.getMap().helpers.getCurrentExtentQuery().geo;
            service.textLimit = null;
            service.gap = 'P1W';
        };

        return service;
    }]);
})();
