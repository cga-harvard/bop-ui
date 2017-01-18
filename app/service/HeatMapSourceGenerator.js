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

            var methods = {
                search: search
            };
            /**
             *
             */
            function getTweetsSearchQueryParameters (bounds) {
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

                $state.go('search', {
                    text: params['q.text'],
                    user: params['q.user'],
                    time: params['q.time'],
                    geo: params['q.geo']
                }, {});

                return params;
            }
            var createParamsForGeospatialSearch = function() {
                //var spatialFilters = MapService.getCurrentExtent(), params;
                return getTweetsSearchQueryParameters();
            };

            return methods;



            /**
             * Performs search with the given full configuration / search object.
             */
            function search(){
                var config,
                    params = createParamsForGeospatialSearch();
                if (params) {
                    params['a.hm.limit'] = solrHeatmapApp.bopwsConfig.heatmapFacetLimit;

                    config = {
                        url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                        method: 'GET',
                        params: params
                    };

                    var responseCache = DataCacheService.getObjData(config.params);
                    if (angular.isObject(responseCache)) {
                        broadcastData(responseCache);
                        return;
                    }

                    //load the data

                    $http(config)
                    .then(function successCallback(response) {
                        // check if we have a heatmap facet and update the map with it
                        var data = response.data;
                        DataCacheService.insertData(config.params, data);
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

            function timeTextFormat(textDate, minDate, maxDate) {
                return textDate === null ? DateTimeService.formatDatesToString(minDate, maxDate) : textDate;
            }
        }]
);
})();
