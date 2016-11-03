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
            var blacklist = ["i", "to", "the", "a", "you", "my", "t.co", "http",
                // "me", "and", "i'm", "is", "in", "it", "that", "of", "for", "at",
                // "on", "just", "this", "so", "be", "lol", "like", "with", "have",
                // "up", "but", "not", "get", "don't", "your", "all", "no", "was",
                // "love", "do", "what", "are", "if", "when", "out", "go", "amp",
                "now", "know", "good", "we", "it's"];
            var comparedList = blacklist.filter(function(blackWord) {
                return blackWord === comparedWord;
            });
            return comparedList.length === 0 ? false : true;
        }

    }]);
})();
