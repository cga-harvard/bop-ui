/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,150]*/
/**
 * HeatMapSourceGenerator Service
 */
(function() {
    angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['Map', '$rootScope', '$controller', '$filter', '$window', '$document', '$http',
        function(Map, $rootScope, $controller, $filter, $window, $document , $http) {
            var MapService= Map;

            var methods = {
                search: search,
                performSearch: performSearch,
                startCsvExport: startCsvExport,
                getFormattedDateString: getFormattedDateString,
                filterObj: filterMethods()
            };
            /**
             *
             */
            function getTweetsSearchQueryParameters (bounds) {

                var reqParamsUi = methods.filterObj.getSearchObj();

                // calculate reduced bounding box
                var dx = bounds.maxX - bounds.minX,
                    dy = bounds.maxY - bounds.minY,
                    minInnerX = bounds.minX + (1 - solrHeatmapApp.appConfig.ratioInnerBbox) * dx,
                    maxInnerX = bounds.minX + (solrHeatmapApp.appConfig.ratioInnerBbox) * dx,
                    minInnerY = bounds.minY + (1 - solrHeatmapApp.appConfig.ratioInnerBbox) * dy,
                    maxInnerY = bounds.minY + (solrHeatmapApp.appConfig.ratioInnerBbox) * dy;

                var params = {
                    'q.text': reqParamsUi.searchText,
                    'q.user': reqParamsUi.user,
                    'q.time': timeTextFormat(reqParamsUi.textDate, reqParamsUi.minDate, reqParamsUi.maxDate),
                    'q.geo': '[' + bounds.minX + ',' + bounds.minY + ' TO ' + bounds.maxX + ',' + bounds.maxY + ']',
                    'a.hm.filter': '[' + minInnerX + ',' + minInnerY + ' TO ' + maxInnerX + ',' + maxInnerY + ']',
                    'a.time.limit': '1',
                    'a.time.gap': 'PT1H',
                    'd.docs.limit': '10'
                };

                return params;
            }
            var createParamsForGeospatialSearch = function() {
                var spatialFilters = MapService.getCurrentExtent(), params;
                if(spatialFilters) {
                    params = getTweetsSearchQueryParameters(
                                        spatialFilters);
                }
                return params;
            };

            return methods;

            function search(input) {
                this.filterObj.setSearchText(input);
                this.performSearch();
            }

            function filterMethods() {
                var searchObj = {
                    minDate: new Date('2013-03-10'),
                    maxDate: new Date('2013-03-21'),
                    textDate: null,
                    searchText : null,
                    user: null,
                    histogramCount: []
                };
                /**
                 * Set keyword text
                 */
                function setSearchText(val) {
                    searchObj.searchText = val.length === 0 ? null : val;
                }

                function setUser(val) {
                    searchObj.user = val.length === 0 ? null : val;
                }

                function setTextDate(val) {
                    searchObj.textDate = val.length === 0 ? null : val;
                }
                /**
                * Returns the complete search object
                */
                function getSearchObj(){
                    return searchObj;
                }

                function setHistogramCount(val) {
                    searchObj.histogramCount = angular.isArray(val) && val.length !== 0 ? val : [];
                }
                return {
                    getSearchObj: getSearchObj,
                    setSearchText: setSearchText,
                    setUser: setUser,
                    setTextDate: setTextDate,
                    setHistogramCount: setHistogramCount
                };
            }

            /**
             * Performs search with the given full configuration / search object.
             */
            function performSearch(){
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
                        // check if we have a heatmap facet and update the map with it
                        var data = response.data;
                        if (data && data['a.hm']) {
                            MapService.createOrUpdateHeatMapLayer(data['a.hm']);
                            // get the count of matches
                            $rootScope.$broadcast('setCounter', data['a.matchDocs']);

                            $rootScope.$broadcast('setHistogram', data['a.time']);

                            $rootScope.$broadcast('setTweetList', data['d.docs']);

                            methods.filterObj.setHistogramCount(data['a.time'].counts);
                        }
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


            /**
             * Help method to build the whole params object, that will be used in
             * the API requests.
             */
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


            /**
             * Returns the formatted date object that can be parsed by API.
             * @param {minDate} date full date object
                            (e.g. 'Sat Jan 01 2000 01:00:00 GMT+0100 (CET))
             * @return {String} formatted date as string (e.g. [2013-03-10T00:00:00 TO 2013-03-21T00:00:00])
             */
            function getFormattedDateString(minDate, maxDate){
                return '[' + minDate.toISOString().replace('.000Z','') + ' TO ' +
                  maxDate.toISOString().replace('.000Z','') + ']';
            }
            function timeTextFormat(textDate, minDate, maxDate) {
                return textDate === null ? getFormattedDateString(minDate, maxDate) : textDate;
            }


        }]
);
})();
