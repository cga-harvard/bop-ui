/*eslint angular/di: [2,'array']*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,150]*/
/**
 * HeatMapSourceGenerator Service
 */
(function() {
angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['Map', '$rootScope', '$controller', '$filter', '$window', '$document', '$http',
        function(MapService, $rootScope, $controller, $filter, $window, $document , $http) {


            var methods = {
                getGeospatialFilter: getGeospatialFilter,
                getTweetsSearchQueryParameters: getTweetsSearchQueryParameters,
                performSearch: performSearch,
                startCsvExport: startCsvExport,
                getFormattedDateString: getFormattedDateString,
                filterObj: filterMethods()
            };

            return methods;


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
              }
            }


            /**
             * Clamps given number `num` to be inside the allowed range from `min`
             * to `max`.
             * Will also work as expected if `max` and `min` are accidently swapped.
             *
             * @param {number} num The number to clamp.
             * @param {number} min The minimum allowed number.
             * @param {number} max The maximim allowed number.
             * @return {number} The clamped number.
             */
            function clamp(num, min, max) {
                if (max < min) {
                    var tmp = min;
                    min = max;
                    max = tmp;
                }
                return Math.min(Math.max(min, num), max);
            }

            /**
             * Determines whether passed longitude is outside of the range `-180`
             * and `+180`.
             *
             * @param {number} lon The longitude to check.
             * @return {boolean} Whether the longitude is outside of the range
             *  -180` and `+180`.
             */
            function outsideLonRange(lon) {
                return lon < -180 || lon > 180;
            }

            /**
             * Determines whether passed latitude is outside of the range `-90` and
             * `+90`.
             * @param {number} lat The longitude to check.
             * @return {boolean} Whether the latitude is outside of the range `-90`
             *  and `+90`.
             */
            function outsideLatRange(lat) {
                return lat < -90 || lat > 90;
            }

            /**
             * Clamps given longitude to be inside the allowed range from `-180` to
             * `+180`.
             * @param {number} lon The longitude to fit / clamp.
             * @return {number} The fitted / clamped longitude.
             */
            function clampLon(lon) {
                return clamp(lon, -180, 180);
            }

            /**
             * Clamps given latitude to be inside the allowed range from `-90` to
             * `+90`.
             * @param {number} lat The latitude to fit / clamp.
             * @return {number} The fitted / clamped latitude.
             */
            function clampLat(lat) {
                return clamp(lat, -90, 90);
            }

            /**
             * Normalizes an `EPSG:4326` extent which may stem from multiple worlds
             * so that the returned extent always is within the bounds of the one
             * true `EPSG:4326` world extent `[-180, -90, 180, 90]`.
             *
             * Examples:
             *
             *     // valid world in, returned as-is:
             *     normalize([-180, -90, 180, 90])  // => [-180, -90, 180, 90]
             *
             *     // valid extent in world in, returned as-is:
             *     normalize([-160, -70, 150, 70])  // => [-160, -70, 150, 70]
             *
             *     // shifted one degree westwards, returns one-true world:
             *     normalize([-181, -90, 179, 90])  // => [-180, -90, 180, 90]
             *
             *     // shifted one degree eastwards, returns one-true world:
             *     normalize([-179, -90, 181, 90])  // => [-180, -90, 180, 90]);
             *
             *     // shifted more than one world westwards, returns one-true world:
             *     normalize([-720, -90, -360, 90]) // => [-180, -90, 180, 90]);
             *
             *     // shifted to the south, returns one-true world:
             *     normalize([-180, -91, 180, 89])  // =>   [-180, -90, 180, 90]);
             *
             *     // multiple worlds, returns one-true world:
             *     normalize([-360, -90, 180, 90])  // =>   [-180, -90, 180, 90]);
             *
             *     // multiple worlds, returns one-true world:
             *     normalize([-360, -180, 180, 90]) // =>  [-180, -90, 180, 90]);
             *
             * @param {Array<number>} Extent to normalize: [minx, miny, maxx, maxy].
             * @return {Array<number>} Normalized extent: [minx, miny, maxx, maxy].
             */
            function normalize(extent) {
                var minX = extent[0];
                var minY = extent[1];
                var maxX = extent[2];
                var maxY = extent[3];
                var width = Math.min(maxX - minX, 360);
                var height = Math.min(maxY - minY, 180);

                if (outsideLonRange(minX)) {
                    minX = clampLon(minX);
                    maxX = minX + width;
                } else if (outsideLonRange(maxX)) {
                    maxX = clampLon(maxX);
                    minX = maxX - width;
                }

                if (outsideLatRange(minY)) {
                    minY = clampLat(minY);
                    maxY = minY + height;
                } else if (outsideLatRange(maxY)) {
                    maxY = clampLat(maxY);
                    minY = maxY - height;
                }

                return [minX, minY, maxX, maxY];
            }

            /**
             * Builds geospatial filter depending on the current map extent.
             * This filter will be used later for `q.geo` parameter of the API
             * search or export request.
             */
            function getGeospatialFilter(){
                var map = MapService.getMap(),
                    viewProj = map.getView().getProjection().getCode(),
                    extent = map.getView().calculateExtent(map.getSize()),
                    extentWgs84 = ol.proj.transformExtent(extent, viewProj, 'EPSG:4326'),
                    transformInteractionLayer = MapService.
                                    getLayersBy('name', 'TransformInteractionLayer')[0],
                    currentBbox,
                    currentBboxExtentWgs84,
                    geoFilter = {};

                if (!transformInteractionLayer) {
                    return null;
                }
                currentBbox = transformInteractionLayer.getSource().getFeatures()[0];
                currentBboxExtentWgs84 = ol.proj.transformExtent(
                                currentBbox.getGeometry().getExtent(), viewProj, 'EPSG:4326');

                // default: Zoom level <= 1 query whole world
                if (map.getView().getZoom() <= 1) {
                    extentWgs84 = [-180, -90 ,180, 90];
                }

                if (extent && extentWgs84){
                    var normalizedExtentMap = normalize(extentWgs84),
                        normalizedExtentBox = normalize(currentBboxExtentWgs84),
                        minX = normalizedExtentMap[1],
                        maxX = normalizedExtentMap[3],
                        minY = normalizedExtentMap[0],
                        maxY = normalizedExtentMap[2];

                    geoFilter.hmFilter = {
                        minX: minX,
                        maxX: maxX,
                        minY: minY,
                        maxY: maxY
                    };

                    minX = normalizedExtentBox[1];
                    maxX = normalizedExtentBox[3];
                    minY = normalizedExtentBox[0];
                    maxY = normalizedExtentBox[2];

                    geoFilter.queryGeo = {
                        minX: minX,
                        maxX: maxX,
                        minY: minY,
                        maxY: maxY
                    };

                    // Reset the date fields
                    // TODO get rid of angular.element
                    var ctrlViewModelNew = angular.element('[ng-controller=GeospatialFilterController]').scope();
                    $controller('GeospatialFilterController', {$scope : ctrlViewModelNew });
                    ctrlViewModelNew.updateFilterString('[' + parseFloat(Math.round(minX * 100) / 100).toFixed(2) + ',' +
                                            parseFloat(Math.round(minY * 100) / 100).toFixed(2) + ' TO ' +
                                            parseFloat(Math.round(maxX * 100) / 100).toFixed(2) + ',' +
                                            parseFloat(Math.round(maxY * 100) / 100).toFixed(2) + ']');
                }

                return geoFilter;
            }

            /**
             * Performs search with the given full configuration / search object.
             */
            function performSearch(){
                var config = {},
                    spatialFilters = this.getGeospatialFilter(),
                    params = this.getTweetsSearchQueryParameters(
                                    spatialFilters.queryGeo, spatialFilters.hmFilter);

                // add additional parameter for the soft maximum of the heatmap grid
                params['a.hm.limit'] = solrHeatmapApp.bopwsConfig.heatmapFacetLimit;
                if (params && spatialFilters !== null) {

                    config = {
                        url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                        method: 'GET',
                        params: params
                    };
                    //load the data
                    $http(config).
                    success(function(data, status, headers, cfg) {
                        // check if we have a heatmap facet and update the map with it
                        if (data && data['a.hm']) {
                            MapService.createOrUpdateHeatMapLayer(data['a.hm']);
                            // get the count of matches
                            $rootScope.$broadcast('setCounter', data['a.matchDocs']);

                            $rootScope.$broadcast('setHistogram', data['a.time']);

                            $rootScope.$broadcast('setTweetList', data['d.docs']);

                            methods.filterObj.setHistogramCount(data['a.time']['counts']);
                        }
                    }).
                    error(function(data, status, headers, cfg) {
                        // hide the loading mask
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
                var config = {},
                    spatialFilters = this.getGeospatialFilter(),
                    params = this.getTweetsSearchQueryParameters(
                                    spatialFilters.queryGeo, spatialFilters.hmFilter);

                // add additional parameter for the number of documents to return
                params['d.docs.limit'] = angular.isNumber(numberOfDocuments) ?
                        numberOfDocuments : solrHeatmapApp.bopwsConfig.csvDocsLimit;

                if (params && spatialFilters !== null) {
                    config = {
                        url: solrHeatmapApp.appConfig.tweetsExportBaseUrl,
                        method: 'GET',
                        params: params
                    };

                    //start the export
                    $http(config).
                    success(function(data, status, headers, cfg) {
                        var anchor = angular.element('<a/>');
                        anchor.css({display: 'none'}); // Make sure it's not visible
                        angular.element($document.body).append(anchor); // Attach to document
                        anchor.attr({
                            href: 'data:attachment/csv;charset=utf-8,' + encodeURI(data),
                            target: '_blank',
                            download: 'bop_export.csv'
                        })[0].click();
                        anchor.remove(); // Clean it up afterwards
                    }).
                    error(function(data, status, headers, cfg) {
                        $window.alert('An error occured while exporting csv data');
                    });
                } else {
                    $window.alert('Spatial filter could not be computed.');
                }
            }

            /**
             *
             */
            function getTweetsSearchQueryParameters(bounds) {

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
