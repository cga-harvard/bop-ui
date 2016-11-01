/*eslint angular/di: [2,"array"]*/
(function() {
    angular.module('SolrHeatmapApp')
    .factory('DateTimeService', [function(){
        var service = {
            formatDatesToString: formatDatesToString
        };

        /**
         * Returns the formatted date object that can be parsed by API.
         * @param {minDate} date full date object
                        (e.g. 'Sat Jan 01 2000 01:00:00 GMT+0100 (CET))
         * @return {String} formatted date as string
            (e.g. [2013-03-10T00:00:00 TO 2013-03-21T00:00:00])
         */
        function formatDatesToString(minDate, maxDate) {
            return '[' + minDate.toISOString().replace('.000Z','') + ' TO ' +
              maxDate.toISOString().replace('.000Z','') + ']';
        }

        return service;
    }]);
})();
