(function() {
    angular
    .module('search_tweetlist_component', [])
    .directive('tweetlist', tweetlist);

    function tweetlist() {
        return {
            link: tweetlistLink,
            restrict: 'EA',
            templateUrl: 'components/tweetlist/tweetlist.tpl.html',
            scope: {}
        };

        function tweetlistLink(scope) {
            var vm = scope;
            vm.tweetList = [];
            vm.tweetList.exist = false;
            vm.$on('setTweetList', setTweetList);

            function setTweetList(event, tweetList) {
                vm.tweetList = tweetList;
                vm.tweetList.exist = true;
            }
        }
    }

})();
