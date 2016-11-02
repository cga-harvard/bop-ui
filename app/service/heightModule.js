/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('HeightModule', ['$window', function($window){

        var service = {
            itemHeight: 90,
            otherHeights: 280,
            sideBarWidth: 405,
            rightSideBarWidth: 4, /* new */
            bottomHeight: 8, /* new */
            documentHeight: documentHeight,
            availableHeight: availableHeight,
            getNumberofItems: calculateNumberofItems,
            topPanelHeight: topPanelHeight
        };

        function documentHeight() {
            var D = document;
            return Math.max(D.body.offsetHeight, D.documentElement.offsetHeight,
                D.body.clientHeight, D.documentElement.clientHeight);
        }

        function topPanelHeight() {
            if ($window.innerWidth < 1200) {
                return 400;
            }
            return 204;
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
