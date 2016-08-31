(function() {
  angular
    .module('search_tweetlist_component', [])
    .directive('tweetlist', tweetlist);

  function tweetlist() {
    return {
      controller: tweetlistController,
      restrict: 'EA',
      templateUrl: 'app/components/tweetlist/tweetlist.html'
    }
  }

  tweetlistController.$inject = ['$scope'];
  function tweetlistController($scope) {

    var vm = $scope;
    vm.tweetlist = {};
    vm.$on('setTweetList', setTweetList);

    function setTweetList(event, tweetlist) {
      vm.tweetlist = tweetlist;
    }
  }
})();
