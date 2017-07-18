
/*eslint angular/di: [2,"array"]*/
(function () {
    angular
    .module('SolrHeatmapApp')
    .factory('dataverseService', ['$rootScope', 'DataConf', '$http',
        function ($rootScope, DataConf, $http) {
            const dataverse = {
                AllowDataverseDeposit: false
            };

            const mapReadyEvent = $rootScope.$on('mapReady', (even, _) => {
                dataverse = DataConf.solrHeatmapApp.bopwsConfig.dataverse;
            });

            function prepareDataverseUrl() {
                const dv = dataverse;
                if (dv.AllowDataverseDeposit) {
                    const urlArray = [dv.dataverseDepositUrl, dv.subsetRetrievalUrl,
                        paramsToString(dv.parameters)];
                    return urlArray.join('?');
                }
                return false;
            }

            function paramsToString(params) {
                const stringParams = [];
                for (let key in params) {
                    stringParams.push(`${key}=${params[key]}`);
                }
                return stringParams.join('&');
            }

            function dataverseRequest(callback) {
                const config = {
                    url: prepareDataverseUrl(),
                    method: 'GET'
                };
                $http(config).then(response => callback(response));
            }

            return {
                getDataverse: () => dataverse,
                prepareDataverseUrl,
                dataverseRequest
            };
        }]);
})();
