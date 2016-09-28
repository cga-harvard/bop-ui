/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Filter by user directive
 */
(function() {
    angular
    .module('search_userFilter_component', [])
    .directive('userFilter', [
        'HeatMapSourceGenerator', 'InfoService', '$uibModal', 'searchFilter',
        function(HeatMapSourceGenerator, InfoService, $uibModal, searchFilter) {
            return {
                link: UserFilterLink,
                restrict: 'EA',
                templateUrl: 'components/userFilter/userFilter.tpl.html',
                scope: {}
            };

            function UserFilterLink(scope) {

                scope.userSearch = userSearch;

                scope.showUserFilterInfo = showUserFilterInfo;

                scope.filter = searchFilter;

                /**
                 *
                 */
                function userSearch() {
                    HeatMapSourceGenerator.search();
                }

                function showUserFilterInfo() {
                    InfoService.showInfoPopup('userfilter');
                }
            }
        }]);
})();
