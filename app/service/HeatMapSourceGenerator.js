/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,150]*/
/**
 * HeatMapSourceGenerator Service
 */
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['Map', '$rootScope', '$controller', '$filter', '$window',
        '$document', '$http', '$state', 'searchFilter', 'DateTimeService', 'DataCacheService',
        function(Map, $rootScope, $controller, $filter, $window, $document,
            $http, $state, searchFilter, DateTimeService, DataCacheService) {
            var MapService= Map;

            return {
                startCsvExport: startCsvExport,
                search: search,
                simpleSearch: simpleSearch
            };

            function simpleSearch(params, callback) {
                var config = {
                    url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                    method: 'GET',
                    params: params
                };
                $http(config).then(function(response) {
                    return callback(response);
                });
            }

            /**
             *
             */
            function createParamsForGeospatialSearch () {
                var params,
                    reqParamsUi = searchFilter;
                /*
                // calculate reduced bounding box
                */
                params = {
                    'q.text': reqParamsUi.text,
                    'q.user': reqParamsUi.user,
                    'q.time': timeTextFormat(reqParamsUi.time, reqParamsUi.minDate, reqParamsUi.maxDate),
                    'q.geo': reqParamsUi.geo,
                    'a.hm.filter': reqParamsUi.hm,
                    'a.time.limit': '1',
                    'a.time.gap': 'P1D',
                    'd.docs.limit': reqParamsUi.numOfDocs,
                    'a.text.limit': reqParamsUi.textLimit,
                    'a.user.limit': reqParamsUi.userLimit,
                    'd.docs.sort': 'distance'
                };

                return params;
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
                var config,
                    params = createParamsForGeospatialSearch();

                if (params) {
                    params['a.hm.limit'] = solrHeatmapApp.bopwsConfig.heatmapFacetLimit;

                    config = {
                        url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                        method: 'GET',
                        params: params
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
                        $window.alert('An error occured while reading heatmap data');
                    })
                    .catch(function() {
                        $window.alert('An error occured while reading heatmap data');
                    });
                } else {
                    $window.alert('Spatial filter could not be computed.');
                }
            }

            function broadcastData(data) {
                data['a.text'] = data['a.text'] || [];

                if (data && data['a.hm']) {
                    MapService.createOrUpdateHeatMapLayer(data['a.hm']);
                    // get the count of matches
                    $rootScope.$broadcast('setCounter', data['a.matchDocs']);

                    $rootScope.$broadcast('setHistogram', data['a.time']);

                    $rootScope.$broadcast('setTweetList', data['d.docs']);

                    $rootScope.$broadcast('setSuggestWords', data['a.text']);

                    $rootScope.$broadcast('setUserSuggestWords', data['a.user']);
                }
            }

            function startCsvExport(numberOfDocuments){
                var config,
                    params = createParamsForGeospatialSearch();
                if (params) {
                    params['d.docs.limit'] = angular.isNumber(numberOfDocuments) ?
                            numberOfDocuments : solrHeatmapApp.bopwsConfig.csvDocsLimit;
                    config = {
                        url: solrHeatmapApp.appConfig.tweetsExportBaseUrl,
                        method: 'GET',
                        params: params
                    };

                    //start the export
                    $http(config)
                    .then(function successCallback(response) {
                        var anchor = angular.element('<a/>');
                        anchor.css({display: 'none'}); // Make sure it's not visible
                        angular.element($document.body).append(anchor); // Attach to document
                        anchor.attr({
                            href: 'data:attachment/csv;charset=utf-8,' + encodeURI(response.data),
                            target: '_blank',
                            download: 'bop_export.csv'
                        })[0].click();
                        anchor.remove(); // Clean it up afterwards
                    }, function errorCallback(response) {
                        $window.alert('An error occured while exporting csv data');
                    })
                    .catch(function() {
                        $window.alert('An error occured while exporting csv data');
                    });
                } else {
                    $window.alert('Spatial filter could not be computed.');
                }
            }

            function timeTextFormat(textDate, minDate, maxDate) {
                return textDate === null ? DateTimeService.formatDatesToString(minDate, maxDate) : textDate;
            }
        }]
);
})();
