/*eslint angular/di: [2,"array"]*/
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('filterKeywordService', [function() {
        return {
            filter: filter
        };

        function filter(keywordObj) {
            return keywordObj.value.length >= 3 && !iskeywordInTheBlacklist(keywordObj.value);
        }

        function iskeywordInTheBlacklist(comparedWord) {
            var blacklist = ["i", "to", "the", "a", "you", "my", "t.co", "http"];
            var comparedList = blacklist.filter(function(blackWord) {
                return blackWord === comparedWord;
            });
            return comparedList.length === 0 ? false : true;
        }

    }]);
})();
