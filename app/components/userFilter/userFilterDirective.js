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
        'HeatMapSourceGenerator', 'InfoService', '$uibModal', 'searchFilter', '$window',
        function(HeatMapSourceGenerator, InfoService, $uibModal, searchFilter, $window) {
            return {
                link: UserFilterLink,
                restrict: 'EA',
                templateUrl: 'components/userFilter/userFilter.tpl.html',
                scope: {}
            };

            function UserFilterLink(scope) {

                scope.doSearch = doSearch;

                scope.showUserFilterInfo = showUserFilterInfo;

                scope.filter = searchFilter;

                scope.onKeyPress = onKeyPress;

                function getKeyboardCodeFromEvent(keyEvt) {
                    return $window.event ? keyEvt.keyCode : keyEvt.which;
                }

                function onKeyPress($event) {
                    // only fire the search if Enter-key (13) is pressed
                    if (getKeyboardCodeFromEvent($event) === 13) {
                        scope.doSearch();
                    }
                }

                /**
                 *
                 */
                function doSearch() {
                    HeatMapSourceGenerator.search();
                }

                function showUserFilterInfo() {
                    InfoService.showInfoPopup('userfilter');
                }
            }
        }]);
})();
