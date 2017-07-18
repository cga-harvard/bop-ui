/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/

(function() {
    angular.module('SolrHeatmapApp')
    .factory('PanelInformationService', ['$window', function($window){

        const service = {
            selectedTweet: {}, tweetStatusUrl
        };

        function tweetStatusUrl(tweetInfo) {
            const url = `https://twitter.com/${tweetInfo.user_name}/status/${tweetInfo.id}`;
            $window.open(url, '_blank');
        }
        return service;
    }]);
})();
