/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,120]*/
/**
 * Search Directive
 */
(function() {
    angular
    .module('search_toolbarsearch_component', [])
    .directive('toolbarSearch', ['$rootScope', 'HeatMapSourceGenerator',
        '$window', 'InfoService', 'searchFilter',
        function toolbarSearch($rootScope, HeatMapSourceGenerator, $window, InfoService, searchFilter) {

            return {
                link: toolbarSearchLink,
                restrict: 'EA',
                templateUrl: 'components/toolbarSearch/toolbarSearchField.tpl.html',
                scope: {
                    numberKeywords: '='
                }
            };

            function toolbarSearchLink(scope) {
                var vm = scope;
                var numberKeywords = vm.numberKeywords || 5;

                vm.filter = searchFilter;
                vm.filterArray = [];
                vm.suggestedKeywords = [];
                vm.textSearchInput = {value: '', previousLength: 0 };
                vm.focus = false;
                vm.tagSwitch = {value: false, disable: false};

                vm.doSearch = doSearch;
                vm.removeKeyWord = removeKeyWord;
                vm.addSuggestedKeywordToSearchInput = addSuggestedKeywordToSearchInput;
                vm.showtoolbarSearchInfo = showtoolbarSearchInfo;
                vm.onKeyPress = onKeyPress;

                vm.toggleSuggestKeywords = toggleSuggestKeywords;

                listenSuggestWords();

                vm.$watch(function(){
                    return vm.filter.text;
                }, function(newValue, oldValue){
                    vm.filterArray = keyWordStringToArray(newValue);
                });

                /**
                 *
                 */
                function getKeyboardCodeFromEvent(keyEvt) {
                    return $window.event ? keyEvt.keyCode : keyEvt.which;
                }

                /**
                 *
                 */
                function onKeyPress($event) {
                    // only fire the search if Enter-key (13) is pressed
                    if (getKeyboardCodeFromEvent($event) === 13) {
                        vm.doSearch();
                    }else if (getKeyboardCodeFromEvent($event) === 8) {
                        removeKeyWordFromDeleteKey();
                    }
                }

                /**
                 *
                 */
                function doSearch() {
                    var fiterText;
                    if (vm.textSearchInput.value.length) {
                        fiterText = vm.filter.text || '';
                        vm.filter.text = fiterText + ' "' + vm.textSearchInput.value + '"';
                        vm.textSearchInput = {value: '', previousLength: 0};
                    }
                    HeatMapSourceGenerator.search(vm.filter.text);
                }

                function showtoolbarSearchInfo() {
                    InfoService.showInfoPopup('textsearch');
                }

                function keyWordStringToArray(keyWordString) {
                    keyWordString = keyWordString || '';
                    return keyWordString.split('"').filter(function(val){
                        return val !== '' && val !== ' ';
                    });
                }

                function removeKeyWord(keyword) {
                    var fiterText = '';
                    vm.filterArray.forEach(function(value) {
                        if (value !== keyword) {
                            fiterText = fiterText === '' ? '"' + value + '"' : fiterText + ' "' + value + '"';
                            return;
                        }
                    });
                    vm.filter.text = fiterText;
                    HeatMapSourceGenerator.search(vm.filter.text);
                }

                function removeKeyWordFromDeleteKey() {
                    if (vm.textSearchInput.value === '' && vm.textSearchInput.previousLength === 0) {
                        removeKeyWord(vm.filterArray.pop());
                    }
                    vm.textSearchInput.previousLength = vm.textSearchInput.value.length;
                }

                function addSuggestedKeywordToSearchInput(keyword) {
                    vm.textSearchInput.value = keyword;
                    doSearch();
                }

                function listenSuggestWords() {
                    vm.$on('setSuggestWords', function(event, dataRawKeywords) {
                        vm.tagSwitch.disable = false;
                        vm.suggestedKeywords = dataRawKeywords.filter(function(obj) {
                            return obj.value.length >= 3;
                        });
                    });
                }

                function toggleSuggestKeywords() {
                    vm.filter.textLimit = vm.tagSwitch.value ? numberKeywords : null;
                    vm.tagSwitch.disable = true;
                    HeatMapSourceGenerator.search();
                }
            }
        }]);
})();
