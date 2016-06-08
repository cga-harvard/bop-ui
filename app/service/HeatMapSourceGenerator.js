/**
 * Map Service
 */
angular
    .module('SolrHeatmapApp')
    .factory('HeatMapSourceGenerator', ['Map', 'GeoNodeSolr', '$rootScope', '$filter', '$http', function(MapService, GeoNodeSolrService, $rootScope, $filter, $http) {

        var LayerWithinMap = {
            term : "LayerWithinMap",
            boost : 80.0
          },

          LayerMatchesScale = {
            term : "LayerMatchesScale",
            boost : 70.0
          },
          LayerMatchesCenter = {
            term : "LayerMatchesCenter",
            boost : 15.0
          },
          LayerAreaIntersection = {
            term : "LayerAreaIntersection",
            boost : 30.0
          },
          searchObj = {
            yearMin: 2005,
            yearMax: 2016,
            searchText : ''
          };

        var methods = {
            getSolrQueryParameters: getSolrQueryParameters,
            performSearch: performSearch,
            setSearchText: setSearchText,
            setMinYear: setMinYear,
            setMaxYear: setMaxYear,
            getSearchObj: getSearchObj
        };

        return methods;

        function setSearchText(val) {
          searchObj.searchText = val;
        }

        function setMinYear(val) {
          searchObj.yearMin = val;
        }

        function setMaxYear(val) {
          searchObj.yearMax = val;
        }

        function getSearchObj(){
          return searchObj;
        }

        function getSolrQueryParameters(){
          var map = MapService.getMap(),
              viewProj = map.getView().getProjection().getCode(),
              extent = map.getView().calculateExtent(map.getSize()),
              center = map.getView().getCenter(),
              centerWgs84,
              extentWgs84,
              solrCenter = {},
              solrBbox = {};

          if (extent && center){
            //transform to WGS84
            centerWgs84 = ol.proj.transform(center, viewProj, 'EPSG:4326');
            extentWgs84 = ol.proj.transformExtent(extent, viewProj, 'EPSG:4326');

            solrBbox = {
              minX: extentWgs84[0],
              maxX: extentWgs84[2],
              minY: extentWgs84[1],
              maxY: extentWgs84[3]
            };
            solrCenter = {
              centerX: centerWgs84[0],
              centerY: centerWgs84[1]
            };

            var params = GeoNodeSolrService.getOgpSpatialQueryParams(solrBbox, solrCenter);
            return params;
          }
        }

        function performSearch(){
          var baseUrl = solrHeatmapApp.appConfig.proxyPath;
          var config = {},
              formatTime = function(year){
                return year + "-01-01T00:00:00.0Z";
              };

          var params = this.getSolrQueryParameters(),
              reqParamsUi = this.getSearchObj();

          if (params && params.fq) {
            // Merge parameters of
            // a) time slider  params.fq.push([fromTo...])
            // b) search field params['q'] = ...
            if (reqParamsUi.searchText.length === 0){
              params.q = '*';
            } else {
              params.q = reqParamsUi.searchText;
            }

            // time slider  params.fq.push([fromTo...])
            timeProp = 'LayerDate:['+ formatTime(reqParamsUi.yearMin)+' TO '+ formatTime(reqParamsUi.yearMax)+']';
            params.fq.push(timeProp);

            baseUrl = './API/mockup2.json';

            config = {
              url: baseUrl,
              method: 'GET',
              params: {
                url: encodeURIComponent(solrHeatmapApp.appConfig.solrBaseUrl) + $.param(params)
              }
            };

            //  load the data at the moment: use mockup
            $http(config).
            success(function(data, status, headers, config) {
              MapService.createOrUpdateHeatMapLayer(data);
            }).
            error(function(data, status, headers, config) {
              // hide the loading mask
              //angular.element(document.querySelector('.waiting-modal')).modal('hide');
              console.log("An error occured while reading heatmap data");
            });
          }
        }

    }]);
