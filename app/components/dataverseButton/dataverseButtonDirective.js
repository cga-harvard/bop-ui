/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Export Directive
 */
(function() {
    angular
    .module('search_dataverseButton_component', [])
    .directive('dataverseButton', ['HeatMapSourceGenerator', 'dataverseService',
        function(HeatMapSourceGenerator, dataverseService) {
            return {
                link: Link,
                restrict: 'EA',
                template: '<a ng-if="dataversefn().AllowDataverseDeposit" ' +
                    'class="btn btn-default" id="dataversebtn" target="_blank"' +
                    'type="button" href="{{linkfn()}}">DATAVERSE</a>',
                scope: {}
            };

            function Link(scope) {
                scope.linkfn = dataverseService.prepareDataverseUrl;
                scope.dataversefn = dataverseService.getDataverse;
            }
        }]);
})();
