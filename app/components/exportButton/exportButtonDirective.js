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
        function(HeatMapSourceGenerator, InfoService) {
            return {
                link: ExportLink,
                restrict: 'EA',
                templateUrl: 'components/exportButton/exportButton.tpl.html',
                scope: {}
            };

            function ExportLink(scope) {

                scope.export = {
                    numDocuments: 1,
                    options: {
                        floor: 1,
                        ceil: 10000,
                        step: 1
                    }
                };

                scope.startExport = function() {
                    var numDocs = scope.export.numDocuments;

                    HeatMapSourceGenerator.startCsvExport(numDocs);
                };

                scope.showExportInfo = function() {
                    InfoService.showInfoPopup('export');
                };
            }
        }]);
})();
