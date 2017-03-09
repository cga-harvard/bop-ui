
/*eslint angular/di: [2,"array"]*/
(function () {
    angular
    .module('SolrHeatmapApp')
    .factory('dataverseService', ['$rootScope', function ($rootScope) {

        var dataverse = {
            AllowDataverseDeposit: false
        };


        var mapReadyEvent = $rootScope.$on('mapReady', function(even, _) {
            dataverse = solrHeatmapApp.bopwsConfig.dataverse;
        });

        function prepareDataverseUrl() {
            var dv = dataverse;
            if (dv.AllowDataverseDeposit) {
                var urlArray = [dv.dataverseDepositUrl, dv.subsetRetrievalUrl,
                    paramsToString(dv.parameters)];
                return urlArray.join('?');
            }
            return false;
        }

        function paramsToString(params) {
            return 'time=' + params.time + '&keywords=' + params.keywords +
            '&extent=' + params.extent;
        }

        return {
            getDataverse: function () {
                return dataverse;
            },
            prepareDataverseUrl: prepareDataverseUrl
        };


    }]);
})();
