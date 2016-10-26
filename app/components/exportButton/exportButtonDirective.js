/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Export Directive
 */
(function() {
    angular
    .module('search_exportButton_component', [])
    .directive('exportButton', ['HeatMapSourceGenerator', 'InfoService',
        'searchFilter', 'Map',
        function(HeatMapSourceGenerator, InfoService, searchFilter, Map) {
            return {
                link: ExportLink,
                restrict: 'EA',
                templateUrl: 'components/exportButton/exportButton.tpl.html',
                scope: {}
            };

            function ExportLink(scope) {
                var vm = scope;
                vm.export = {
                    numDocuments: 1,
                    options: {
                        floor: 1,
                        ceil: 10000,
                        step: 1
                    }
                };

                vm.reset = reset;

                vm.startExport = function() {
                    var numDocs = scope.export.numDocuments;

                    HeatMapSourceGenerator.startCsvExport(numDocs);
                };

                vm.showExportInfo = function() {
                    InfoService.showInfoPopup('export');
                };

                function reset() {
                    // Reset the map
                    Map.resetMap();
                    searchFilter.resetFilter();
                    HeatMapSourceGenerator.search();
                }
            }
        }]);
})();
