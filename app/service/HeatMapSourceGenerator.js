/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,150]*/
/**
 * HeatMapSourceGenerator Service
 */
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['DataConf', 'Map', '$rootScope', '$log',
        '$q', '$http', '$state', 'searchFilter', '$window', '$httpParamSerializer',
        function(DataConf, Map, $rootScope, $log, $q, $http, $state, searchFilter,
            $window, $httpParamSerializer) {
            const MapService = Map;
            let canceler = $q.defer();

            function simpleSearch(params, callback) {
                const sF = searchFilter;
                params['q.text'] = sF.text;
                params['q.user'] = sF.user;
                params['q.time'] = timeTextFormat(sF.time, sF.minDate, sF.maxDate);
                canceler.resolve();
                canceler = $q.defer();
                const config = {
                    url: DataConf.solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                    method: 'GET',
                    params: params,
                    timeout: canceler.promise
                };
                $http(config).then(response => callback(response));
            }

            /**
             *
             */
            function createParamsForGeospatialSearch () {
                const sF = searchFilter;
                return {
                    'q.text': sF.text,
                    'q.user': sF.user,
                    'q.time': timeTextFormat(sF.time, sF.minDate, sF.maxDate),
                    'q.geo': sF.geo,
                    'a.hm.filter': sF.hm,
                    'a.hm.posSent': sF.posSent,
                    'a.time.limit': '1',
                    'a.time.gap': sF.gap,
                    'd.docs.limit': sF.numOfDocs,
                    'a.text.limit': sF.textLimit,
                    'a.user.limit': sF.userLimit,
                    'd.docs.sort': 'distance',
                    'a.hm.limit': DataConf.solrHeatmapApp.bopwsConfig.heatmapFacetLimit
                };
            }

            function setUrlwithParams(params) {
                $state.go('search', {
                    text: params['q.text'],
                    user: params['q.user'],
                    time: params['q.time'],
                    geo: params['q.geo']
                }, {});
            }

            /**
             * Performs search with the given full configuration / search object.
             */
            function search(changeUrl){
                const params = createParamsForGeospatialSearch();
                changeUrl = angular.isUndefined(changeUrl) || changeUrl ? true : false;
                if (params) {
                    canceler.resolve();
                    canceler = $q.defer();
                    const config = {
                        url: DataConf.solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                        method: 'GET',
                        params: params,
                        timeout: canceler.promise
                    };
                    //load the data
                    $http(config)
                    .then(response => {
                        if (changeUrl) {
                            setUrlwithParams(params);
                        }
                        broadcastData(response.data);

                    }, errorResponse => {
                        $log.error('An error occured while reading heatmap data', errorResponse);
                        $http.get('./config/demoBOP.json').then(response => {
                            broadcastData(response.data);
                        }, errorResponse => {
                            $log.error('An error occured while reading the demo heatmap data', errorResponse);
                        });
                    })
                    .catch(function(e) {
                        $log.error('An error occured while reading heatmap data', e);
                    });
                } else {
                    $log.error('Spatial filter could not be computed.');
                }
            }

            function broadcastData(data) {
                data['a.text'] = data['a.text'] || [];
                if (data && data['a.hm']) {
                    const heatmapData = data['a.hm.posSent'] ? NormalizeSentiment(data) : data['a.hm'];

                    MapService.getMap().heatmap.createOrUpdateHeatMapLayer(heatmapData);

                    $rootScope.$broadcast('setCounter', data['a.matchDocs']);
                    $rootScope.$broadcast('setHistogram', data['a.time']);
                    $rootScope.$broadcast('setTweetList', data['d.docs']);
                    $rootScope.$broadcast('setSuggestWords', data['a.text']);
                    $rootScope.$broadcast('setUserSuggestWords', data['a.user']);
                }
            }

            function NormalizeSentiment(heatMapData) {
                const heatMapCountMatrix = heatMapData['a.hm'].counts_ints2D;
                const positivesCountMatrix = heatMapData['a.hm.posSent'].counts_ints2D;

                const normalPositivesCountMatrix = heatMapCountMatrix.map(
                    function (heatMapCountRow, rowIndex) {
                        if (angular.isArray(heatMapCountRow) ) {
                            const normalizedSentimentRow = new Uint8Array(heatMapCountRow.length);
                            heatMapCountRow.map( (heatMapCellvalue, cellIndex) => {
                                if (heatMapCellvalue !== 0 && positivesCountMatrix[rowIndex]) {
                                    normalizedSentimentRow[cellIndex] = (positivesCountMatrix[rowIndex][cellIndex]/heatMapCellvalue)*100;
                                } else {
                                    normalizedSentimentRow[cellIndex] = null;
                                }
                            });
                            return normalizedSentimentRow;
                        }else{
                            return null;
                        }
                    });

                heatMapData['a.hm.posSent'].counts_ints2D = normalPositivesCountMatrix;
                heatMapData['a.hm.posSent'].posSent = true;
                return heatMapData['a.hm.posSent'];
            }

            function startCsvExport(numberOfDocuments){
                let url;
                const params = createParamsForGeospatialSearch();
                if (params) {
                    params['d.docs.limit'] = angular.isNumber(numberOfDocuments) ?
                            numberOfDocuments : DataConf.solrHeatmapApp.bopwsConfig.csvDocsLimit;

                    url = DataConf.solrHeatmapApp.appConfig.tweetsExportBaseUrl;
                    $window.open(url + '?' + $httpParamSerializer(params), '_blank');
                } else {
                    $log.error('Spatial filter could not be computed.');
                }
            }

            function timeTextFormat(textDate, minDate, maxDate) {
                return textDate === null ? BOP.dateTimeService.formatDatesToString(minDate, maxDate) : textDate;
            }

            return {
                startCsvExport: startCsvExport,
                search: search,
                simpleSearch: simpleSearch
            };
        }]
);
})();
