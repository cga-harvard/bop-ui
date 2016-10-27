/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('PanelInformationService', [function(){

        var service = {
            selectedTweet: {}
        };

        return service;
    }]);
})();
