/**
 * Map Service
 */
angular
    .module('SolrHeatmapApp')
    .factory('GeoNodeSolr', ['$rootScope', '$filter', '$http', function( $rootScope, $filter, $http) {

        var params= {},
            methods = {
              getOgpSpatialQueryParams: getOgpSpatialQueryParams,
              classicLayerMatchesArea: classicLayerMatchesArea,
              classicLayerAreaIntersectionScore: classicLayerAreaIntersectionScore,
              classicLayerWithinMap: classicLayerWithinMap,
              classicCenterRelevancyClause: classicCenterRelevancyClause,
              layerNearCenterClause: layerNearCenterClause,
              getIntersectionFilter: getIntersectionFilter,
              getIntersectionFunction: getIntersectionFunction,
              combineParams: combineParams
          };

        return methods;

        // all we need is "bounds", which in the application is the map extent
        function getOgpSpatialQueryParams(bounds, center) {
          // term objects
          // boost have to be extremely high when using boost function syntax to match
          // up with
          // values in previous version.
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
              };
          /*
           * var centerLon = this.getCenter(bounds.minX, bounds.maxX); var
           * centerLat = this.getCenter(bounds.minY, bounds.maxY);
           * console.log(centerLon); console.log(centerLat);
           */
          // bf clauses are additive
          // var area = this.getBoundsArea(bounds);
          var bf_array = [
              this.classicLayerMatchesArea(bounds) + "^" + 70,
              this.classicLayerAreaIntersectionScore(bounds) + "^" + LayerAreaIntersection.boost,
              this.classicCenterRelevancyClause(center) + "^" + LayerMatchesCenter.boost,
              this.classicLayerWithinMap(bounds) + "^" + LayerWithinMap.boost ];
              // fq : [ this.getIntersectionFilter(), "Area:[0 TO 400]" ],
          var params = {
            bf : bf_array,
            fq : [this.getIntersectionFilter(), 'Area:[0 TO 400]', '!(Area:1 AND MaxX:0 AND MaxY:0)' ],
            intx : this.getIntersectionFunction(bounds)
          };
          var heatmapParams = {
            "facet" : true,
            "facet.heatmap" : "bbox",
            "facet.heatmap.format" : "ints2D",
            "facet.heatmap.geom" : '["' + bounds.minX + ' ' + bounds.minY + '" TO "' + bounds.maxX + ' ' + bounds.maxY + '"]'
          };
          params = this.combineParams(params, heatmapParams);

          // TODO doc
          params.start = 0;
          params.rows = 0;

          params.sort = 'score desc';
          params.qf = 'LayerTitleSynonyms^0.2 ThemeKeywordsSynonymsIso^0.1 ThemeKeywordsSynonymsLcsh^0.1 PlaceKeywordsSynonyms^0.1 Publisher^0.1 Originator^0.1 Abstract^0.2';
          params.wt = 'json';
          params.defType = 'edismax';
          params.facet = true;

          return params;
        }

        /**
         * return a search element to boost the scores of layers whose scale matches
         * the displayed map scale specifically, it compares their area
         */
        function classicLayerMatchesArea(bounds) {
          var mapDeltaX = Math.abs(bounds.maxX - bounds.minX);
          var mapDeltaY = Math.abs(bounds.maxY - bounds.minY);
          var mapArea = (mapDeltaX * mapDeltaY);
          var smoothingFactor = 1000;
          var layerMatchesArea = "recip(sum(abs(sub(Area," + mapArea + ")),.01),1," + smoothingFactor + "," + smoothingFactor + ")";
          return layerMatchesArea;
        }


        /**
         * return a search clause whose score reflects how much of the map this
         * layers covers 9 points in a 3x3 grid are used. we compute how many of
         * those 9 points are within the the layer's bounding box. This count is
         * then normalized and multiplied by the boost the grid is evenly space and
         * does not include points on the edge of the map. for example, for a 3x3
         * grid we use 9 points spaced at 1/4, 1/2 and 3/4 x and y each point in the
         * grid is weighted evenly
         */
        function classicLayerAreaIntersectionScore(bounds) {
          var mapMaxX = bounds.maxX;
          var mapMinX = bounds.minX;
          var mapMinY = bounds.minY;
          var mapMaxY = bounds.maxY;

          var stepCount = 3; // use 3x3 grid
          var mapDeltaX = Math.abs(mapMaxX - mapMinX);
          var mapXStepSize = mapDeltaX / (stepCount + 1.0);

          var mapDeltaY = Math.abs(mapMaxY - mapMinY);
          var mapYStepSize = mapDeltaY / (stepCount + 1.0);

          var clause = "sum("; // add up all the map points within the layer
          for (var i = 0; i < stepCount; i++) {

            for (var j = 0; j < stepCount; j++) {

              var currentMapX = mapMinX + ((i + 1) * mapXStepSize);
              var currentMapY = mapMinY + ((j + 1) * mapYStepSize);

              // console.log([currentMapX, currentMapY]);
              // is the current map point in the layer
              // that is, is currentMapX between MinX and MaxX and is
              // currentMapY betweeen MinY and MaxY

              // why 400? this should not be a fixed size
              var thisPointWithin = "map(sum(map(sub(" + currentMapX + ",MinX),0,400,1,0),";
              thisPointWithin += "map(sub(" + currentMapX + ",MaxX),-400,0,1,0),";
              thisPointWithin += "map(sub(" + currentMapY + ",MinY),0,400,1,0),";
              thisPointWithin += "map(sub(" + currentMapY +  ",MaxY),-400,0,1,0)),";
              thisPointWithin += "4,4,1,0)"; // final map values

              // note that map(" + currentMapX + ",MinX,MaxX,1,0) doesn't work
              // because the min,max,target in map must be constants, not
              // field values
              // so we do many sub based comparisons

              if ((i > 0) || (j > 0)) {
                clause += ","; // comma separate point checks
              }

              clause += thisPointWithin;
            }
          }
          clause += ")";

          // clause has the sum of 9 point checks, this could be 9,6,4,3,2,1 or 0
          // normalize to between 0 and 1, then multiple by boost

          clause = "product(" + clause + "," + (1.0 / (stepCount * stepCount)) + ")";

          return clause;
        }

        /**
         * compute a score for layers within the current map the layer's MinX and
         * MaxX must be within the map extent in X and the layer's MinY and MaxY
         * must be within the map extent in Y I had trouble using a range based test
         * (e.g., MinX:[mapMinX+TO+mapMapX]) along with other scoring functions
         * based on _val_. So, this function is like the other scoring functions and
         * uses _val_. The Solr "sum" function returns 4 if the layer is contained
         * within the map. The outer "map" converts 4 to 1 and anything else to 0.
         * Finally, the product converts the 1 to LayerWithinMapBoost
         */
        function classicLayerWithinMap(bounds) {
          var mapMinX = bounds.minX;
          var mapMaxX = bounds.maxX;
          var mapMinY = bounds.minY;
          var mapMaxY = bounds.maxY;

          var layerWithinMap = "if(and(exists(MinX),exists(MaxX),exists(MinY),exists(MaxY)),";

          layerWithinMap += "map(sum(";
          layerWithinMap += "map(MinX," + mapMinX + "," + mapMaxX + ",1,0),";
          layerWithinMap += "map(MaxX," + mapMinX + "," + mapMaxX + ",1,0),";
          layerWithinMap += "map(MinY," + mapMinY + "," + mapMaxY + ",1,0),";
          layerWithinMap += "map(MaxY," + mapMinY + "," + mapMaxY + ",1,0))";
          layerWithinMap += ",4,4,1,0),0)";

          return layerWithinMap;
        }

        /**
         * score layer based on how close map center latitude is to the layer's
         * center latitude
         */
        function layerNearCenterClause(center, minTerm, maxTerm) {
          var smoothingFactor = 1000;
          var layerMatchesCenter = "recip(abs(sub(product(sum(" + minTerm + "," + maxTerm + "),.5)," + center + ")),1," + smoothingFactor + "," + smoothingFactor + ")";
          return layerMatchesCenter;
        }

        function classicCenterRelevancyClause(center) {
          var clause = "sum("+ this.layerNearCenterClause(center.centerX, "MinX", "MaxX") + ",";
          clause += this.layerNearCenterClause(center.centerY, "MinY", "MaxY")     + ")";
          return clause;
        }

        /**
         * Query component to filter out non-intersecting layers.
         *
         * @return {string} Query string filter
         */
        function getIntersectionFilter() {
          // this filter should not be cached, since it will be different each
          // time
          return "{!frange l=0 incl=false cache=false}$intx";
        }

        /**
         * Returns the intersection area of the layer and map.
         *
         * @return {string} Query string to calculate intersection
         */
        function getIntersectionFunction(bounds) {
          // TODO: this needs work. have to account for dateline crossing properly
          var getRangeClause = function(minVal, minTerm, maxVal, maxTerm) {

            var rangeClause = "max(0,sub(min(" + maxVal + "," + maxTerm + "),max(" + minVal + "," + minTerm + ")))";
            return rangeClause;
          };

          var xRange;
          if (bounds.minX > bounds.maxX) {
            // crosses the dateline
            var xRange1 = getRangeClause(bounds.minX, "MinX", 180, "MaxX");
            var xRange2 = getRangeClause(-180, "MinX", bounds.maxX, "MaxX");
            xRange = "sum(" + xRange1 + "," + xRange2 + ")";
          } else {
            xRange = getRangeClause(bounds.minX, "MinX", bounds.maxX, "MaxX");
          }

          var yRange = getRangeClause(bounds.minY, "MinY", bounds.maxY, "MaxY");

          var intersection = "product(" + xRange + "," + yRange + ")";

          return intersection;

        }

        function combineParams() {
          var newParams = {};
          for ( var i in arguments) {
            var currentObj = arguments[i];

            for ( var j in currentObj) {
              if (typeof newParams[j] === "undefined" || newParams[j].length === 0) {
                newParams[j] = currentObj[j];
              } else if (jQuery.isArray(newParams[j])) {
                if (jQuery.isArray(currentObj[j])) {
                  for ( var k in currentObj[j]) {
                    newParams[j].push(currentObj[j][k]);
                  }
                } else {
                  newParams[j].push(currentObj[j]);
                }
              } else {
                newParams[j] = currentObj[j];
              }
            }
          }

          return newParams;
        }

    }]);
