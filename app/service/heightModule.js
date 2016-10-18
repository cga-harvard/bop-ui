/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('HeightModule', [function(){

        var service = {
            itemHeight: 90,
            otherHeights: 410,
            documentHeight: documentHeight,
            availableHeight: availableHeight,
            getNumberofItems: calculateNumberofItems
        };

        function documentHeight() {
            var D = document;
            return Math.max(D.body.offsetHeight, D.documentElement.offsetHeight,
                D.body.clientHeight, D.documentElement.clientHeight);
        }

        function availableHeight() {
            return documentHeight() - service.otherHeights;
        }

        function calculateNumberofItems() {
            var height = availableHeight();
            if (height > 0) {
                return Math.round(height / service.itemHeight);
            }
            return 10;
        }

        return service;
    }]);
})();
