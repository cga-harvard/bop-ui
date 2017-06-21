/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,150]*/
/**
 * HeatMapSourceGenerator Service
 */
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['Map', '$rootScope', '$controller', '$filter', '$log',
        '$document', '$q', '$http', '$state', 'searchFilter', 'DateTimeService',
        'DataCacheService', '$httpParamSerializer', '$window',
        function(Map, $rootScope, $controller, $filter, $log, $document, $q,
            $http, $state, searchFilter, DateTimeService, DataCacheService, $httpParamSerializer, $window) {
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
                    url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
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
                    'a.hm.limit': solrHeatmapApp.bopwsConfig.heatmapFacetLimit
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
                        url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
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
                    .catch(function() {
                        $log.error('An error occured while reading heatmap data');
                    });
                } else {
                    $log.error('Spatial filter could not be computed.');
                }
            }

            function broadcastData(data) {
                data['a.text'] = data['a.text'] || [];
                var heatmapData = {};
                if (data && data['a.hm']) {
                    if (data['a.hm.posSent']) {
                        heatmapData = data['a.hm.posSent'];
                        heatmapData.posSent = true;
                    }else {
                        heatmapData = data['a.hm'];
                    }
                    MapService.createOrUpdateHeatMapLayer(heatmapData);
                    $rootScope.$broadcast('setCounter', data['a.matchDocs']);
                    $rootScope.$broadcast('setHistogram', data['a.time']);
                    $rootScope.$broadcast('setTweetList', data['d.docs']);
                    $rootScope.$broadcast('setSuggestWords', data['a.text']);
                    $rootScope.$broadcast('setUserSuggestWords', data['a.user']);
                }
            }

            function startCsvExport(numberOfDocuments){
                var url,
                    params = createParamsForGeospatialSearch();
                if (params) {
                    params['d.docs.limit'] = angular.isNumber(numberOfDocuments) ?
                            numberOfDocuments : solrHeatmapApp.bopwsConfig.csvDocsLimit;

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
