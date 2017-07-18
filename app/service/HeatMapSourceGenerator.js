/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,150]*/
/**
 * HeatMapSourceGenerator Service
 */
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['DataConf', 'Map', '$rootScope', '$controller', '$filter', '$log',
        '$document', '$q', '$http', '$state', 'searchFilter', 'DateTimeService', 'DataCacheService',
        function(DataConf, Map, $rootScope, $controller, $filter, $log, $document, $q,
            $http, $state, searchFilter, DateTimeService, DataCacheService) {
            var MapService= Map;
            var canceler = $q.defer();

            function simpleSearch(params, callback) {
                var sF = searchFilter;
                params['q.text'] = sF.text;
                params['q.user'] = sF.user;
                params['q.time'] = timeTextFormat(sF.time, sF.minDate, sF.maxDate);
                canceler.resolve();
                canceler = $q.defer();
                var config = {
                    url: DataConf.solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                    method: 'GET',
                    params: params,
                    timeout: canceler.promise
                };
                $http(config).then(function(response) {
                    return callback(response);
                });
            }

            /**
             *
             */
            function createParamsForGeospatialSearch () {
                var sF = searchFilter;
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
                var config, params = createParamsForGeospatialSearch();
                changeUrl = angular.isUndefined(changeUrl) || changeUrl ? true : false;
                if (params) {
                    canceler.resolve();
                    canceler = $q.defer();
                    config = {
                        url: DataConf.solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                        method: 'GET',
                        params: params,
                        timeout: canceler.promise
                    };
                    //load the data
                    $http(config)
                    .then(function successCallback(response) {
                        if (changeUrl) {
                            setUrlwithParams(params);
                        }
                        // check if we have a heatmap facet and update the map with it
                        var data = response.data;
                        // DataCacheService.insertData(config.params, data);
                        broadcastData(data);

                    }, function errorCallback(response) {
                        $log.error('An error occured while reading heatmap data');
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
                    var heatmapData = data['a.hm.posSent'] ? NormalizeSentiment(data) : data['a.hm'];

                    MapService.createOrUpdateHeatMapLayer(heatmapData);
                    $rootScope.$broadcast('setCounter', data['a.matchDocs']);
                    $rootScope.$broadcast('setHistogram', data['a.time']);
                    $rootScope.$broadcast('setTweetList', data['d.docs']);
                    $rootScope.$broadcast('setSuggestWords', data['a.text']);
                    $rootScope.$broadcast('setUserSuggestWords', data['a.user']);
                }
            }

            function NormalizeSentiment(heatMapData) {
                var heatMapCountMatrix = heatMapData['a.hm'].counts_ints2D;
                var positivesCountMatrix = heatMapData['a.hm.posSent'].counts_ints2D;

                var normalPositivesCountMatrix = heatMapCountMatrix.map(
                    function (heatMapCountRow, rowIndex) {
                        if (angular.isArray(heatMapCountRow) ) {
                            var normalizedSentimentRow = new Uint8Array(heatMapCountRow.length);
                            heatMapCountRow.map(function (heatMapCellvalue, cellIndex) {
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
                var url,
                    params = createParamsForGeospatialSearch();
                if (params) {
                    params['d.docs.limit'] = angular.isNumber(numberOfDocuments) ?
                            numberOfDocuments : DataConf.solrHeatmapApp.bopwsConfig.csvDocsLimit;

                    url = solrHeatmapApp.appConfig.tweetsExportBaseUrl;
                    $window.open(url + '?' + $httpParamSerializer(params), '_blank');
                } else {
                    $log.error('Spatial filter could not be computed.');
                }
            }

            function timeTextFormat(textDate, minDate, maxDate) {
                return textDate === null ? DateTimeService.formatDatesToString(minDate, maxDate) : textDate;
            }

            return {
                startCsvExport: startCsvExport,
                search: search,
                simpleSearch: simpleSearch
            };
        }]
);
})();
