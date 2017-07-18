/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('HeightModule', ['$window', function($window){

        const service = {
            itemHeight: 90,
            rightSideBarWidth: 4,
            bottomHeight: 4,
            otherHeights,
            sideBarWidth,
            topPanelHeight,
            documentHeight,
            availableHeight,
            getNumberofItems
        };

        function documentHeight() {
            const D = document;
            return Math.max(D.body.offsetHeight, D.documentElement.offsetHeight,
                D.body.clientHeight, D.documentElement.clientHeight);
        }

        function topPanelHeight() {
            if ($window.innerWidth < 1200) {
                return 4;
            }
            return 102;
        }

        function otherHeights() {
            if ($window.innerWidth < 1200) {
                return 560;
            }
            return 350;
        }

        function sideBarWidth() {
            if ($window.innerWidth < 800) {
                return 4;
            }
            return 400;
        }

        function availableHeight() {
            return documentHeight() - service.otherHeights();
        }

        function getNumberofItems() {
            const height = availableHeight();
            if (height > 0) {
                return Math.round(height / service.itemHeight);
            }
            return 10;
        }

        return service;
    }]);
})();
