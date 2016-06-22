/**
 * HeatMapSourceGenerator Service
 */
angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['Map', '$rootScope', '$filter', '$http', function(MapService, $rootScope, $filter, $http) {

        var searchObj = {
            minDate: new Date('2000-01-01'),
            maxDate: new Date('2016-12-31'),
            searchText : ''
        };

        var methods = {
            getGeospatialFilter: getGeospatialFilter,
            getTweetsSearchQueryParameters: getTweetsSearchQueryParameters,
            performSearch: performSearch,
            setSearchText: setSearchText,
            setMinDate: setMinDate,
            setMaxDate: setMaxDate,
            getFormattedDateString: getFormattedDateString,
            getSearchObj: getSearchObj
        };

        return methods;

        /**
         * Set keyword text
         */
        function setSearchText(val) {
          searchObj.searchText = val;
        }

        /**
         * Set start search date
         */
        function setMinDate(val) {
          searchObj.minDate = val;
        }

        /**
         * Set end search date
         */
        function setMaxDate (val) {
          searchObj.maxDate = val;
        }

        /**
         * Returns the complete search object
         */
        function getSearchObj(){
          return searchObj;
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
                geoFilter = {};

            if (extent && extentWgs84){

                var minX = extentWgs84[1],
                    maxX = extentWgs84[3]
                    minY = wrapLon(extentWgs84[0]),
                    maxY = wrapLon(extentWgs84[2]);

                geoFilter = {
                    minX: minX,
                    maxX: maxX,
                    minY: minY < maxY ? minY : maxY,
                    maxY: maxY > minY ? maxY : minY
                };
            }

            return geoFilter;
        }

        /**
         * Performs search with the given full configuration / search object.
         */
        function performSearch(){

          var config = {},
              params = this.getTweetsSearchQueryParameters(this.getGeospatialFilter());

          if (params) {

              config = {
                  url: solrHeatmapApp.appConfig.tweetsSearchBaseUrl,
                  method: 'GET',
                  params: params
              };

            //load the data
            $http(config).
            success(function(data, status, headers, config) {
              // check if we have a heatmap facet and update the map with it
              if (data && data["a.hm"]) {
                  MapService.createOrUpdateHeatMapLayer(data["a.hm"]);
                  // get the count of matches
                  $rootScope.$broadcast('setCounter', data["a.matchDocs"]);
              }
            }).
            error(function(data, status, headers, config) {
              // hide the loading mask
              //angular.element(document.querySelector('.waiting-modal')).modal('hide');
              console.log("An error occured while reading heatmap data");
            });
          }
        }

        /**
         * Help method to build the whole params object, that will be used in
         * the API requests.
         */
        function getTweetsSearchQueryParameters(bounds) {

            // get keyword and time range
            var reqParamsUi = this.getSearchObj(),
                keyword;

            if (reqParamsUi.searchText.length === 0){
                keyword = '*';
            } else {
                keyword = reqParamsUi.searchText;
            }

            var params = {
                "q.text": keyword,
                "q.time": '[' + this.getFormattedDateString(reqParamsUi.minDate) + ' TO ' + this.getFormattedDateString(reqParamsUi.maxDate) + ']',
                "q.geo": '[' + bounds.minX + ',' + bounds.minY + ' TO ' + bounds.maxX + ',' + bounds.maxY + ']',
                "a.hm.limit": 1000
            };

           return params;
        }

        /**
         * Wrap longitude to the WGS84 bounds [-90,-180,90,180]
         */
        function wrapLon(value) {
            var worlds = Math.floor((value + 180) / 360);
            return value - (worlds * 360);
        }

        /**
         * Returns the formatted date object that can be parsed by API.
         * @param {Date} date full date object (e.g. 'Sat Jan 01 2000 01:00:00 GMT+0100 (CET))
         * @return {String} formatted date as string (e.g. '2000-01-01')
         */
         function getFormattedDateString(date){
             return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
         }
    }]);
