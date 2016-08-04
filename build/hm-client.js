/**
 * The main solrHeatmapApp module
 */
(function() {
  angular.module('SolrHeatmapApp', [
    'ui.bootstrap',
    'rzModule',
    'search_components'
  ]);
})();

/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/
/**
 * DatePickerCtrl Controller
 */
(function() {

angular
    .module('search_datepicker_component', [])
    .directive('datePicker', datePicker);

    function datePicker() {
      return {
        controller: datePickerFilterController,
        templateUrl: 'app/components/datepicker/datepicker.html',
        restrict: 'EA'
      };
    }

    datePickerFilterController.$inject = ['HeatMapSourceGenerator', '$uibModal', '$scope'];
    function datePickerFilterController(HeatMapSourceGeneratorService, $uibModal, $scope) {

            var vm = $scope;

            vm.initialDateOptions = {
                minDate: new Date('2010-01-01'),
                maxDate: new Date('2013-12-31')
            };

            vm.dateOptions = {
                minDate: HeatMapSourceGeneratorService.filterObj.getSearchObj().minDate,
                maxDate: HeatMapSourceGeneratorService.filterObj.getSearchObj().maxDate,
                startingDay: 1, // Monday
                showWeeks: false
            };

            vm.dateString = getFormattedDateString(vm.dateOptions.minDate, vm.dateOptions.maxDate);

            vm.startDate = {
                opened: false
            };

            vm.endDate = {
                opened: false
            };

            vm.onChangeDatepicker = onChangeDatepicker;

            vm.showInfo = showInfo;

            vm.openEndDate = openEndDate;

            vm.openStartDate = openStartDate;

            vm.onSubmitDateText = onSubmitDateText;

            vm.slider = defaultSliderValue();

            /**
             * Set initial values for min and max dates in both of datepicker.
             */
            vm.setInitialDates = function(){
                vm.dts = vm.dateOptions.minDate;
                vm.dte = vm.dateOptions.maxDate;
            };

            vm.setInitialDates();


            /**
             * Will be called on click on start datepicker.
             * `minDate` will be reset to the initial value (e.g. 2000-01-01),
             * `maxDate` will be adjusted with the `$scope.dte` value to
             *  restrict it not to be below the `minDate`.
             */
            function openStartDate() {
                vm.startDate.opened = true;
                vm.dateOptions.minDate = vm.initialDateOptions.minDate;
                vm.dateOptions.maxDate = vm.dte;
            };


            /**
             * Will be called on click on end datepicker.
             * `maxDate` will be reset to the initial value (e.g. 2016-12-31),
             * `minDate` will be adjusted with the `$scope.dts` value to
             *  restrict it not to be bigger than the `maxDate`.
             */
            function openEndDate() {
                vm.endDate.opened = true;
                vm.dateOptions.maxDate = vm.initialDateOptions.maxDate;
                vm.dateOptions.minDate = vm.dts;
            };


            /**
             * Will be fired after the start and the end date was chosen.
             */
            function onChangeDatepicker(){
                vm.dateString = getFormattedDateString(vm.dts, vm.dte);
                performDateSearch();
            };

            function getFormattedDateString(minDate, maxDate) {
              return '[' + minDate.toISOString().replace('.000Z','') + ' TO ' +
                  maxDate.toISOString().replace('.000Z','') + ']';
            }

            function stringToDate(dateString) {
                var dateArray = dateString.split(' TO ');
                if (typeof(dateString) === 'string' && dateArray.length === 2) {
                  dateArray[0] = new Date(dateArray[0].slice(1,11));
                  dateArray[1] = new Date(dateArray[1].slice(0,10));
                  if (dateArray[0] == 'Invalid Date' || dateArray[0] == 'Invalid Date') {
                    return null;
                  }
                  return dateArray;
                }
                return null;
            }

            function onSubmitDateText() {
                var dateArray = stringToDate(vm.dateString);
                if (dateArray !== null) {
                  vm.dts = dateArray[0];
                  vm.dte = dateArray[1];
                  performDateSearch();
                } else{
                  vm.dateString = getFormattedDateString(vm.dts, vm.dte)
                }
            }

            function showInfo(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.datepicker.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.datepicker.toolTitle;
                        }
                    }
                });
            };

            vm.$on('setHistogram', function(event, dataHistogram) {
              if (vm.slider.options.ceil === 10) {
                vm.slider.counts = dataHistogram.counts;
                vm.slider.options.ceil = vm.slider.maxValue = dataHistogram.counts.length - 1;
              }
            })

            vm.$on('slideEnded', function() {
              var minKey = vm.slider.minValue,
                  maxKey = vm.slider.maxValue;
              vm.dts =  new Date(vm.slider.counts[minKey].value);
              vm.dte =  new Date(vm.slider.counts[maxKey].value);
              vm.dateString = getFormattedDateString(vm.dts, vm.dte);
              performDateSearch();
            });

            function performDateSearch() {
              HeatMapSourceGeneratorService.filterObj.setTextDate(vm.dateString);
              HeatMapSourceGeneratorService.performSearch();
            }

            function defaultSliderValue() {
              return {
                minValue: 0,
                maxValue: 10,
                active: false,
                options: {
                  floor: 0,
                  ceil: 10,
                  step: 1,
                  noSwitching: true, hideLimitLabels: true,
                  getSelectionBarColor: function() {
                    return '#dadada';
                  },
                  translate: function() {
                    return '';
                  }
                }
              };
            };
        }

})();

(function() {

angular
  .module('search_timehistogram_component', [])
  .directive('timeHistogram', timeHistogram);

function timeHistogram() {
  var directive = {
    template: '<div class="bar-graph" id="{{barId}}" style="width: 400px";></div>',
    restrict: 'EA',
    link: link
  };
  return directive;

  function link(scope, element, attr) {

    scope.barId = attr.barid;

    scope.$on('setHistogram', function(even, histogram) {
      makeHistogram(histogram);
    });

    /**
     * Create histogram
     */
    function makeHistogram(histogram) {

      findHistogramMaxValue();
      renderingSvgBars();

      function findHistogramMaxValue() {
        histogram.maxValue = Math.max.apply(null, histogram.counts.map(function(obj) {
          return obj.count;
        }));
      }

      function renderingSvgBars() {
        if (histogram.counts) {
          histogram.bars = document.getElementById(scope.barId);

          var barsheight = 60;
          var rectWidth = (histogram.bars.offsetWidth / histogram.counts.length);
          var svgRect = histogram.counts.map(function(bar, barKey) {
            var height = histogram.maxValue === 0 ? 0 : barsheight * bar.count / histogram.maxValue;
            var y = barsheight - height;
            var translate = (rectWidth) * barKey;
            return '<g transform="translate(' + translate + ', 0)">' +
                   '  <rect width="' + rectWidth + '" height="' + height + '" y="' + y + '" fill="#B0B0B0"></rect>' +
                   '</g>';
          });
          histogram.bars.innerHTML = '<svg width="100%" height="' + barsheight + '">' + svgRect.join('') + '</svg>';
        }
      }
    }
  }
}

}());

(function() {
  angular.module('search_components', [
    'search_timehistogram_component',
    'search_datepicker_component'
  ]);
})();

/*eslint angular/di: [2,"array"]*/
/**
 * BackgroundLayer Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('BackgroundLayerController',
        ['MapService', '$scope', function(MapService, $scope) {

            var vm = this;

            /**
             *
             */
            vm.layers = {};
            vm.selectedLayer = {};

            /**
             *
             */
            vm.$on('mapReady', function(event, map) {
                vm.layers = map.getLayers().getArray();
                vm.selectedLayer = {
                    name: vm.getBackgroundLayers()[0].get('name')
                };
            });

            /**
             *
             */
            vm.isBackgroundLayer = function(layer) {
                var isBackgroundLayer = false;
                if (layer.get('backgroundLayer')) {
                    isBackgroundLayer = true;
                }
                return isBackgroundLayer;
            };

            /**
             *
             */
            vm.setBackgroundLayer = function(layer) {
                angular.forEach(vm.getBackgroundLayers(), function(bgLayer) {
                    if (bgLayer === layer) {
                        layer.setVisible(true);
                        vm.selectedLayer = {name: layer.get('name')};
                    } else {
                        bgLayer.setVisible(false);
                    }
                });
            };

            /**
             *
             */
            vm.getBackgroundLayers = function() {
                var layers = MapService.getMap().getLayers().getArray();

                return layers.filter(function(l) {
                    if (l.get('backgroundLayer')) {
                        return true;
                    } else {
                        return false;
                    }
                });
            };

        }]
);

/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Export Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ExportController', ['HeatMapSourceGenerator', '$uibModal', '$scope',
        function(HeatMapSourceGeneratorService, $uibModal, $scope) {

            $scope.export = {
                numDocuments: 1,
                options: {
                    floor: 1,
                    ceil: 10000,
                    step: 1
                }
            };

            $scope.startExport = function() {
                var numDocs = $scope.export.numDocuments;

                HeatMapSourceGeneratorService.startCsvExport(numDocs);
            };

            $scope.showInfo = function(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.export.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.export.toolTitle;
                        }
                    }
                });
            };

        }]
);

/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/**
 * Geospatial filter Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('GeospatialFilterController', ['$scope', '$uibModal',
        function($scope, $uibModal) {

            $scope.filterString = '[-90,-180 TO 90,180]';

            $scope.showInfo = function(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.
                                            geospatialsearch.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.
                                            geospatialsearch.toolTitle;
                        }
                    }
                });
            };

            $scope.updateFilterString = function(str) {
                $scope.filterString = str;
            };
        }]
);

/*eslint angular/controller-as: 0*/
/**
 * InfoWindowController
 */
angular
    .module('SolrHeatmapApp')
    .controller('InfoWindowController',
        function ($scope, $uibModalInstance, infoMsg, toolName) {

            $scope.infoMsg = infoMsg;
            $scope.toolName = toolName;

            $scope.ok = function () {
                $uibModalInstance.close();
            };
        })
;

/*eslint angular/no-services: [2,{"directive":["$http","$q"],"controller":["$resource"]}]*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,110]*/
/**
 * Main Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('MainController', ['Map', 'HeatMapSourceGenerator' , '$http', '$scope', '$rootScope',
        function(MapService, HeatMapSourceGeneratorService, $http, $scope, $rootScope) {

            var vm = this;

            solrHeatmapApp = vm;

            //  get the app config
            $http.get('./config/appConfig.json').
                success(function(data, status, headers, config) {
                    if (data && data.mapConfig) {
                        var mapConf = data.mapConfig,
                            appConf = data.appConfig,
                            bopwsConfig = data.bopwsConfig,
                            instructions = data.instructions;

                        // create the map with the given config
                        MapService.init({
                            mapConfig: mapConf
                        });
                        solrHeatmapApp.appConfig = appConf;
                        solrHeatmapApp.initMapConf = mapConf;
                        solrHeatmapApp.bopwsConfig = bopwsConfig;
                        solrHeatmapApp.instructions = instructions;

                        // fire event mapReady
                        $rootScope.$broadcast('mapReady', MapService.getMap());

                        MapService.getMap().getView()
                            .on('change:resolution', function(evt){
                                var existingHeatMapLayers = MapService.getLayersBy('name', 'HeatMapLayer');
                                if (existingHeatMapLayers &&
                                        existingHeatMapLayers.length > 0){
                                    var radius = 500 * evt.target.getResolution();
                                    var hmLayer = existingHeatMapLayers[0];
                                    if (radius > 15) {
                                        radius = 15;
                                    }
                                    hmLayer.setRadius(radius);
                                    hmLayer.setBlur(radius*2);
                                }

                                // check box of transform interaction
                                MapService.checkBoxOfTransformInteraction();
                            });
                        /*
                        * register some events
                        */
                        MapService.getMap().on('moveend', function(evt){
                            HeatMapSourceGeneratorService.performSearch();
                        });

                        MapService.getInteractionsByClass(ol.interaction.Transform)[0].on(
                            ['translateend', 'scaleend'], function (e) {
                                HeatMapSourceGeneratorService.performSearch();
                            });

                      // Prepared featureInfo (display number of elements)
                      //solrHeatmapApp.map.on('singleclick',
                      //                          MapService.displayFeatureInfo);

                    } else {
                        throw 'Could not find the mapConfig';
                    }
                }).
                error(function(data, status, headers, config) {
                    throw 'Error while loading the config.json';
                });
        }]
);

/*eslint angular/di: [2,"array"]*/
/*eslint angular/controller-as: 0*/
/**
 * ResultCounter Controller
 */
angular
    .module('SolrHeatmapApp')
    .controller('ResultCounterController', ['$scope', function($scope) {

        $scope.$on('setCounter', function(e, data){
            if (data < 1) {
                data = "No results found";
            }
            $scope.counter = data;
        });
    }]);

/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,120]*/
/**
 * Search Controller
 */
angular.module('SolrHeatmapApp')
    .controller('SearchController', ['Map', 'HeatMapSourceGenerator', '$scope', '$uibModal', '$controller', '$window',
        function(MapService, HeatMapSourceGeneratorService, $scope, $uibModal, $controller, $window) {

            /**
             *
             */
            $scope.searchInput = '';

            /**
             *
             */
            function getKeyboardCodeFromEvent(keyEvt) {
                return $window.event ? keyEvt.keyCode : keyEvt.which;
            }

            /**
             *
             */
            $scope.onKeyPress = function($event) {
                // only fire the search if Enter-key (13) is pressed
                if (getKeyboardCodeFromEvent($event) === 13) {
                    $scope.doSearch();
                }
            };

            /**
             *
             */
            $scope.doSearch = function() {
                // if no input is given
                // if ($scope.searchInput.length === 0) {
                //    return false;
                // }

                HeatMapSourceGeneratorService.filterObj.setSearchText($scope.searchInput);
                HeatMapSourceGeneratorService.performSearch();
            };

            $scope.resetSearchInput = function() {
                $scope.searchInput = '';
                HeatMapSourceGeneratorService.filterObj.setSearchText('');
                HeatMapSourceGeneratorService.performSearch();

                // Reset the map
                MapService.resetMap();

                // Reset the date fields
                var ctrlViewModelNew = $scope.$new();
                $controller('DatePickerController', {$scope : ctrlViewModelNew });
                ctrlViewModelNew.setInitialDates();
            };

            $scope.showInfo = function(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.textsearch.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.textsearch.toolTitle;
                        }
                    }
                });
            };

        }]

);

/*eslint angular/controller-as: 0*/
/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,90]*/
/**
 * Filter by user controller
 */
(function() {
angular
    .module('SolrHeatmapApp')
    .controller('UserFilterController', ['HeatMapSourceGenerator', '$scope', '$uibModal',
        function(HeatMapSourceGeneratorService, $scope, $uibModal) {

            $scope.userSearch = userSearch;

            $scope.showInfo = showInfo;

            /**
             *
             */
            function userSearch() {
              HeatMapSourceGeneratorService.filterObj.setUser($scope.userfilterInput);
              HeatMapSourceGeneratorService.performSearch();
            }

            function showInfo(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowController',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return solrHeatmapApp.instructions.
                                                    userfilter.instruction;
                        },
                        toolName: function(){
                            return solrHeatmapApp.instructions.
                                                    userfilter.toolTitle;
                        }
                    }
                });
            }
        }]
);
})();

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
                            methods.filterObj.setHistogramCount(data['a.time']['counts']);
                        }
                    }).
                    error(function(data, status, headers, cfg) {
                        // hide the loading mask
                        //angular.element(document.querySelector('.waiting-modal')).modal('hide');
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
                    'a.time.gap': 'PT1H'
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

/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 2*/
/*eslint max-len: [2,100]*/
/**
 * Map Service
 */
(function() {
angular.module('SolrHeatmapApp')
    .factory('Map', ['$rootScope', '$filter', '$document',
        function($rootScope, $filter, $document) {

            var map = {},
                defaults = {
                    renderer: 'canvas',
                    view: {
                        center: [0 ,0],
                        projection: 'EPSG:3857',
                        zoom: 2
                    }
                },
                rs = $rootScope;

            /**
             *
             */
            function buildMapLayers(layerConfig) {
                var layer,
                    layers = [];

                if (angular.isArray(layerConfig)) {
                    angular.forEach(layerConfig, function(conf) {
                        if (conf.type === 'TileWMS') {
                            layer = new ol.layer.Tile({
                                name: conf.name,
                                backgroundLayer: conf.backgroundLayer,
                                displayInLayerPanel: conf.displayInLayerPanel,
                                source: new ol.source.TileWMS({
                                    attributions: [new ol.Attribution({
                                        html: conf.attribution
                                    })],
                                    crossOrigin: conf.crossOrigin,
                                    logo: conf.logo,
                                    params: conf.params,
                                    ratio: conf.ratio,
                                    resolutions: conf.resoltions,
                                    url: conf.url
                                }),
                                opacity: conf.opacity,
                                visible: conf.visible
                            });
                        }
                        if (conf.type === 'ImageWMS') {
                            layer = new ol.layer.Image({
                                name: conf.name,
                                backgroundLayer: conf.backgroundLayer,
                                displayInLayerPanel: conf.displayInLayerPanel,
                                source: new ol.source.ImageWMS({
                                    attributions: [new ol.Attribution({
                                        html: conf.attribution
                                    })],
                                    crossOrigin: conf.crossOrigin,
                                    logo: conf.logo,
                                    params: conf.params,
                                    resolutions: conf.resoltions,
                                    url: conf.url
                                }),
                                opacity: conf.opacity,
                                visible: conf.visible
                            });
                        }
                        layers.push(layer);
                    });
                }
                return layers;
            }

            /**
            *
            */
            function getMap() {
                return map;
            }

            /**
             *
             */
            function getLayersBy(key, value) {
                var layers = getMap().getLayers().getArray();
                return $filter('filter')(layers, function(layer) {
                    return layer.get(key) === value;
                });
            }

            /**
             *
             */
            function getInteractionsByClass(value) {
                var interactions = getMap().getInteractions().getArray();
                return $filter('filter')(interactions, function(interaction) {
                    return interaction instanceof value;
                });
            }

            /**
             *
             */
            function getInteractionsByType(interactions, type) {
                return $filter('filter')(interactions, function(interaction) {
                    return interaction.type_ === type;
                });
            }

            /**
             *
             */
            function displayFeatureInfo(evt) {
                var coord = evt.coordinate,
                    feature = map.forEachFeatureAtPixel(evt.pixel,
                            function(feat, layer) {
                                return feat;
                            }),
                    msg = '',
                    evtCnt = 0,
                    lyrCnt = 0,
                    container = $document[0].getElementById('popup'),
                    content = $document[0].getElementById('popup-content'),
                    closer = $document[0].getElementById('popup-closer'),
                    overlay = new ol.Overlay({
                        element: container,
                        autoPan: true,
                        autoPanAnimation: {
                            duration: 250
                        }
                    });

                closer.onclick = function() {
                    overlay.setPosition(undefined);
                    closer.blur();
                    return false;
                };

                // remove any existing overlay before adding a new one
                map.getOverlays().clear();
                map.addOverlay(overlay);

                if (feature) {
                    var data = feature.get('origVal');
                    if (data) {
                        $rootScope.$broadcast('featureInfoLoaded', data);
                    }
                }

                rs.$on('featureInfoLoaded', function(event, dta) {
                    msg += '<h5>Number of elements: </h5>' + data;
                    content.innerHTML = msg;
                    var overlayFi = solrHeatmapApp.
                                map.getOverlays().getArray()[0];
                    if (overlayFi) {
                        overlayFi.setPosition(coord);
                    }
                });

            }

            /**
            * Helper method to change active mode of masks for backgroundLayer and
            * heatmap layer
            */
            function switchMasks(hmAvailable) {
                var heatMapLayer = getLayersBy('name', 'HeatMapLayer')[0],
                    heatMapMask = heatMapLayer.getFilters()[0],
                    backgroundLayer = getLayersBy('backgroundLayer', true)[0],
                    backgroundLayerMask = backgroundLayer.getFilters()[0];

                // disable mask of backgroundLayer if heatmap is available and vice versa
                backgroundLayerMask.setActive(!hmAvailable);
                // enable mask of heatMapLayer if heatmap is available and vice versa
                heatMapMask.setActive(hmAvailable);
            }

            function heatmapMinMax(heatmap, stepsLatitude, stepsLongitude){
                var max = -1;
                var min = Number.MAX_VALUE;
                for (var i = 0 ; i < stepsLatitude ; i++){
                    var currentRow = heatmap[i];
                    if (currentRow === null){
                        heatmap[i] = currentRow = [];
                    }
                    for (var j = 0 ; j < stepsLongitude ; j++){
                        if (currentRow[j] === null){
                            currentRow[j] = -1;
                        }

                        if (currentRow[j] > max){
                            max = currentRow[j];
                        }

                        if (currentRow[j] < min && currentRow[j] > -1){
                            min = currentRow[j];
                        }
                    }
                }
                return [min, max];
            }

            function rescaleHeatmapValue(value, minMaxValue){
                if (value === null){
                    return 0;
                }

                if (value === -1){
                    return -1;
                }

                if (value === 0){
                    return 0;
                }

                if ((minMaxValue[1] - minMaxValue[0]) === 0){
                    return 0;
                }

                return (value - minMaxValue[0]) / (minMaxValue[1] - minMaxValue[0]);
            }

            /*
             *
             */
            function createHeatMapSource(hmParams) {
                var counts_ints2D = hmParams.counts_ints2D,
                    gridLevel = hmParams.gridLevel,
                    gridColumns = hmParams.columns,
                    gridRows = hmParams.rows,
                    minX = hmParams.minX,
                    minY = hmParams.minY,
                    maxX = hmParams.maxX,
                    maxY = hmParams.maxY,
                    hmProjection = hmParams.projection,
                    dx = maxX - minX,
                    dy = maxY - minY,
                    sx = dx / gridColumns,
                    sy = dy / gridRows,
                    olFeatures = [],
                    minMaxValue,
                    sumOfAllVals = 0,
                    olVecSrc;

                if (!counts_ints2D) {
                    return null;
                }
                minMaxValue = heatmapMinMax(counts_ints2D, gridRows, gridColumns);
                for (var i = 0 ; i < gridRows ; i++){
                    for (var j = 0 ; j < gridColumns ; j++){
                        var hmVal = counts_ints2D[counts_ints2D.length-i-1][j],
                            lon,
                            lat,
                            feat,
                            coords;

                        if (hmVal && hmVal !== null){
                            lat = minY + i*sy + (0.5 * sy);
                            lon = minX + j*sx + (0.5 * sx);
                            coords = ol.proj.transform(
                              [lon, lat],
                              hmProjection,
                              map.getView().getProjection().getCode()
                            );

                            feat = new ol.Feature({
                                geometry: new ol.geom.Point(coords)
                            });

                            // needs to be rescaled.
                            var scaledValue = rescaleHeatmapValue(hmVal,minMaxValue);
                            feat.set('weight', scaledValue);
                            feat.set('origVal', hmVal);

                            olFeatures.push(feat);
                        }
                    }
                }

                olVecSrc = new ol.source.Vector({
                    features: olFeatures,
                    useSpatialIndex: true
                });
                return olVecSrc;
            }

            function createOrUpdateHeatMapLayer(data) {
                var olVecSrc = createHeatMapSource(data),
                    existingHeatMapLayers = getLayersBy('name', 'HeatMapLayer'),
                    transformInteractionLayer = getLayersBy('name', "TransformInteractionLayer")[0],
                    newHeatMapLayer;

                if (existingHeatMapLayers && existingHeatMapLayers.length > 0){
                    var currHeatmapLayer = existingHeatMapLayers[0];
                    // Update layer source
                    var layerSrc = currHeatmapLayer.getSource();
                    if (layerSrc){
                        layerSrc.clear();
                    }
                    currHeatmapLayer.setSource(olVecSrc);
                } else {
                    newHeatMapLayer = new ol.layer.Heatmap({
                        name: 'HeatMapLayer',
                        source: olVecSrc,
                        radius: 10
                    });

                    map.addLayer(newHeatMapLayer);

                    // Add Mask to HeatMapLayer
                    var currentBBox = transformInteractionLayer.getSource().getFeatures()[0];

                    var mask = new ol.filter.Mask({
                        feature: currentBBox,
                        inner: false,
                        fill: new ol.style.Fill({
                            color: [255,255,255,0.5]
                        })
                    });
                    newHeatMapLayer.addFilter(mask);
                }

                switchMasks(olVecSrc !== null);
            }


            function setTransactionBBox(extent) {
                var transformationLayer = getLayersBy('name','TransformInteractionLayer')[0],
                    vectorSrc = transformationLayer.getSource(),
                    currentBbox = vectorSrc.getFeatures()[0],
                    polyNew;

                polyNew = ol.geom.Polygon.fromExtent(extent);
                currentBbox.setGeometry(polyNew);

                // update interaction
                map.getInteractions().getArray().forEach(function(interaction){
                    if(interaction instanceof ol.interaction.Transform){
                        interaction.dispatchEvent('propertychange');
                    }
                });
            }

            /**
             * This method adds a transfrom interaction to the mapand a mask to background layer
             * The area outer the feature which can be modified by the transfrom interaction
             * will have a white shadow
             */
            function generateMaskAndAssociatedInteraction (bboxFeature, fromSrs) {
                var polygon = new ol.Feature(ol.geom.Polygon.fromExtent(bboxFeature)),
                    backGroundLayer = getLayersBy('backgroundLayer', true)[0],
                    heatMapLayer = getLayersBy('name', 'HeatMapLayer')[0];

                if (fromSrs !== map.getView().getProjection().getCode()){
                    var polygonNew = ol.proj.transformExtent(bboxFeature, fromSrs,
                                                    map.getView().getProjection().getCode());
                    polygon = new ol.Feature(ol.geom.Polygon.fromExtent(polygonNew));
                }

                // TransformInteractionLayer
                // holds the value of q.geo
                var vector = new ol.layer.Vector({
                    name: 'TransformInteractionLayer',
                    source: new ol.source.Vector(),
                    style: new ol.style.Style({
                        fill: new ol.style.Fill({
                            color: [255,255,255,0.01]
                        })
                    })
                });
                map.addLayer(vector);
                vector.getSource().addFeature(polygon);

                var transformInteraction = new ol.interaction.Transform({
                    translate: true,
                    scale: true,
                    translateFeature: false,
                    rotate: false,
                    stretch: false
                });
                map.addInteraction(transformInteraction);

                var mask = new ol.filter.Mask({
                    feature: polygon,
                    inner:false,
                    fill: new ol.style.Fill({
                        color:[255,255,255,0.5]
                    })
                });
                backGroundLayer.addFilter(mask);
            }

            /*
             * For change:resolution event (zoom in map):
             * If bounding of transform interaction is grater than the map extent
             * the transform box will be resized to 90%
             */
            function checkBoxOfTransformInteraction () {
                var transformInteractionLayer = getLayersBy('name', 'TransformInteractionLayer')[0],
                    mapExtent = map.getView().calculateExtent(map.getSize()),
                    vectorSrc = transformInteractionLayer.getSource(),
                    currentBbox = vectorSrc.getFeatures()[0],
                    needsUpdate = false,
                    ordArray = currentBbox.getGeometry().getCoordinates()[0];

                // check if current bbox is greater than map extent
                for (var i = 0; i<ordArray.length; i++) {
                    if (! new ol.geom.Point(ordArray[i]).intersectsExtent(mapExtent)){
                        needsUpdate = true;
                        break;
                    }
                }

                if (needsUpdate === true) {
                    // calculate reduced bounding box
                    var minx = mapExtent[0],
                        miny = mapExtent[1],
                        maxx = mapExtent[2],
                        maxy = mapExtent[3],
                        dx = maxx - minx,
                        dy = maxy - miny,
                        minInnerX = minx + (1 - solrHeatmapApp.appConfig.ratioInnerBbox) * dx,
                        maxInnerX = minx + (solrHeatmapApp.appConfig.ratioInnerBbox) * dx,
                        minInnerY = miny + (1 - solrHeatmapApp.appConfig.ratioInnerBbox) * dy,
                        maxInnerY = miny + (solrHeatmapApp.appConfig.ratioInnerBbox) * dy;

                    setTransactionBBox([ minInnerX, minInnerY, maxInnerX, maxInnerY]);
                }

            }

            /**
             * Helper method to reset the map
             */
            function resetMap() {
                // Reset view
                var intitalCenter = solrHeatmapApp.initMapConf.view.center,
                    intitalZoom = solrHeatmapApp.initMapConf.view.zoom;
                if (intitalZoom && intitalCenter) {
                    var vw = map.getView();
                    vw.setCenter(intitalCenter);
                    vw.setZoom(intitalZoom);

                    setTransactionBBox(solrHeatmapApp.initMapConf.view.extent);
                }
            }

            /**
             *
             */
            function init(config) {
                var viewConfig = angular.extend(defaults.view,
                                                    config.mapConfig.view),
                    rendererConfig = angular.extend(defaults.renderer,
                                                    config.mapConfig.renderer),
                    layerConfig = config.mapConfig.layers;

                map = new ol.Map({
                    controls: ol.control.defaults().extend([
                        new ol.control.ScaleLine(),
                        new ol.control.ZoomSlider()
                    ]),
                    interactions: ol.interaction.defaults(),
                    layers: buildMapLayers(layerConfig),
                    renderer: angular.isString(rendererConfig) ?
                                            rendererConfig : undefined,
                    target: 'map',
                    view: new ol.View({
                        center: angular.isArray(viewConfig.center) ?
                                viewConfig.center : undefined,
                        maxZoom: angular.isNumber(viewConfig.maxZoom) ?
                                viewConfig.maxZoom : undefined,
                        minZoom: angular.isNumber(viewConfig.minZoom) ?
                                viewConfig.minZoom : undefined,
                        projection: angular.isString(viewConfig.projection) ?
                                viewConfig.projection : undefined,
                        resolution: angular.isString(viewConfig.resolution) ?
                                viewConfig.resolution : undefined,
                        resolutions: angular.isArray(viewConfig.resolutions) ?
                                viewConfig.resolutions : undefined,
                        rotation: angular.isNumber(viewConfig.rotation) ?
                                viewConfig.rotation : undefined,
                        zoom: angular.isNumber(viewConfig.zoom) ?
                                viewConfig.zoom : undefined,
                        zoomFactor: angular.isNumber(viewConfig.zoomFactor) ?
                                viewConfig.zoomFactor : undefined
                    })
                });

                if (angular.isArray(viewConfig.extent)) {
                    var vw = map.getView();
                    vw.set('extent', viewConfig.extent);
                    generateMaskAndAssociatedInteraction(viewConfig.extent, viewConfig.projection);
                }
            }

            var ms = {
                init: init,
                getMap: getMap,
                getLayersBy: getLayersBy,
                getInteractionsByClass: getInteractionsByClass,
                getInteractionsByType: getInteractionsByType,
                displayFeatureInfo: displayFeatureInfo,
                createOrUpdateHeatMapLayer: createOrUpdateHeatMapLayer,
                generateMaskAndAssociatedInteraction: generateMaskAndAssociatedInteraction,
                checkBoxOfTransformInteraction: checkBoxOfTransformInteraction,
                setTransactionBBox: setTransactionBBox,
                createHeatMapSource: createHeatMapSource,
                heatmapMinMax: heatmapMinMax,
                rescaleHeatmapValue: rescaleHeatmapValue,
                resetMap: resetMap
            };

            return ms;
        }]
);
})();

/** Interaction rotate
 * @constructor
 * @extends {ol.interaction.Pointer}
 * @fires select | rotatestart | rotating | rotateend | translatestart | translating | translateend | scalestart | scaling | scaleend
 * @param {olx.interaction.TransformOptions} 
 *  - layers {Array<ol.Layer>} array of layers to transform, 
 *  - features {ol.Collection<ol.Feature>} collection of feature to transform, 
 *	- translateFeature {bool} Translate when click on feature
 *	- translate {bool} Can translate the feature
 *	- stretch {bool} can stretch the feature
 *	- scale {bool} can scale the feature
 *	- rotate {bool} can rotate the feature
 *	- style {} list of ol.style for handles
 *
 */
ol.interaction.Transform = function(options) 
{	if (!options) options={};
	var self = this;

	ol.interaction.Pointer.call(this, 
	{	handleDownEvent: this.handleDownEvent_,
		handleDragEvent: this.handleDragEvent_,
		handleMoveEvent: this.handleMoveEvent_,
		handleUpEvent: this.handleUpEvent_
	});

	/** Collection of feature to transform */
	this.features_ = options.features;
	/** List of layers to transform */
	this.layers_ = options.layers ? (options.layers instanceof Array) ? options.layers:[options.layers] : null;

	/** Translate when click on feature */
	this.set('translateFeature', (options.translateFeature!==false));
	/** Can translate the feature */
	this.set('translate', (options.translate!==false));
	/** Can stretch the feature */
	this.set('stretch', (options.stretch!==false));
	/** Can scale the feature */
	this.set('scale', (options.scale!==false));
	/** Can rotate the feature */
	this.set('rotate', (options.rotate!==false));

	// Force redraw when changed
	this.on ('propertychange', function()
	{	this.drawSketch_();
	});

	// Create a new overlay layer for the sketch
	this.handles_ = new ol.Collection();
	this.overlayLayer_ = new ol.layer.Vector(
		{	source: new ol.source.Vector({
				features: this.handles_,
				useSpatialIndex: false
			}),
			name:'Transform overlay',
			displayInLayerSwitcher: false,
			// Return the style according to the handle type
			style: function (feature)
				{	return (self.style[(feature.get('handle')||'default')+(feature.get('constraint')||'')+(feature.get('option')||'')]);
				}
		});

	// setstyle
	this.setDefaultStyle();

};
ol.inherits(ol.interaction.Transform, ol.interaction.Pointer);

/** Cursors for transform
*/
ol.interaction.Transform.prototype.Cursors = 
{	'default':	'auto',
	'select':	'pointer',
	'translate':'move',
	'rotate':	'move',
	'scale':	'ne-resize', 
	'scale1':	'nw-resize', 
	'scale2':	'ne-resize', 
	'scale3':	'nw-resize',
	'scalev':	'e-resize', 
	'scaleh1':	'n-resize', 
	'scalev2':	'e-resize', 
	'scaleh3':	'n-resize'
};

/**
 * Remove the interaction from its current map, if any,  and attach it to a new
 * map, if any. Pass `null` to just remove the interaction from the current map.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.Transform.prototype.setMap = function(map) 
{	if (this.getMap()) this.getMap().removeLayer(this.overlayLayer_);
	ol.interaction.Pointer.prototype.setMap.call (this, map);
	this.overlayLayer_.setMap(map);
	this.isTouch = /touch/.test(map.getViewport().className);
	this.setDefaultStyle();
};

/**
 * Activate/deactivate interaction
 * @param {bool} 
 * @api stable
 */
ol.interaction.Transform.prototype.setActive = function(b) 
{	ol.interaction.Pointer.prototype.setActive.call (this, b);
	if (b) this.select(null);
};


/** Set efault sketch style
*/
ol.interaction.Transform.prototype.setDefaultStyle = function() 
{	// Style
	var stroke = new ol.style.Stroke({ color: [255,0,0,1], width: 1 });
	var strokedash = new ol.style.Stroke({ color: [255,0,0,1], width: 1, lineDash:[4,4] });
	var fill0 = new ol.style.Fill({ color:[255,0,0,0.01] });
	var fill = new ol.style.Fill({ color:[255,255,255,0.8] });
	var circle = new ol.style.RegularShape({
					fill: fill,
					stroke: stroke,
					radius: this.isTouch ? 12 : 6,
					points: 15
				});
	circle.getAnchor()[0] = this.isTouch ? -10 : -5;
	var bigpt = new ol.style.RegularShape({
					fill: fill,
					stroke: stroke,
					radius: this.isTouch ? 16 : 8,
					points: 4,
					angle: Math.PI/4
				});
	var smallpt = new ol.style.RegularShape({
					fill: fill,
					stroke: stroke,
					radius: this.isTouch ? 12 : 6,
					points: 4,
					angle: Math.PI/4
				});
	function createStyle (img, stroke, fill) 
	{	return [ new ol.style.Style({image:img, stroke:stroke, fill:fill}) ];
	}
	/** Style for handles */
	this.style = 
	{	'default': createStyle (bigpt, strokedash, fill0),
		'translate': createStyle (bigpt, stroke, fill),
		'rotate': createStyle (circle, stroke, fill),
		'rotate0': createStyle (bigpt, stroke, fill),
		'scale': createStyle (bigpt, stroke, fill),
		'scale1': createStyle (bigpt, stroke, fill),
		'scale2': createStyle (bigpt, stroke, fill),
		'scale3': createStyle (bigpt, stroke, fill),
		'scalev': createStyle (smallpt, stroke, fill),
		'scaleh1': createStyle (smallpt, stroke, fill),
		'scalev2': createStyle (smallpt, stroke, fill),
		'scaleh3': createStyle (smallpt, stroke, fill),
	};
	this.drawSketch_();
}

/**
 * Set sketch style.
 * @param {ol.Map} map Map.
 * @api stable
 */
ol.interaction.Transform.prototype.setStyle = function(style, olstyle) 
{	if (!olstyle) return;
	if (olstyle instanceof Array) this.style[style] = olstyle;
	else this.style[style] = [ olstyle ];
	for (var i=0; i<this.style[style].length; i++)
	{	var im = this.style[style][i].getImage();
		if (im) 
		{	if (style == 'rotate') im.getAnchor()[0] = -5;
			if (this.isTouch) im.setScale(1.8);
		}
		var tx = this.style[style][i].getText();
		if (tx) 
		{	if (style == 'rotate') tx.setOffsetX(this.isTouch ? 14 : 7);
			if (this.isTouch) tx.setScale(1.8);
		}
	}
	this.drawSketch_();
};

/** Get Feature at pixel
 * @param {ol.Pixel} 
 * @return {ol.feature} 
 * @private
 */
ol.interaction.Transform.prototype.getFeatureAtPixel_ = function(pixel) 
{	return this.getMap().forEachFeatureAtPixel(pixel,
		function(feature, layer) 
		{	var found = false;
			// Overlay ?
			if (!layer)
			{	if (feature===this.bbox_) return false;
				this.handles_.forEach (function(f) { if (f===feature) found=true; });
				if (found) return { feature: feature, handle:feature.get('handle'), constraint:feature.get('constraint'), option:feature.get('option') };
			}
			// feature belong to a layer
			if (this.layers_)
			{	for (var i=0; i<this.layers_.length; i++)
				{	if (this.layers_[i]===layer) return { feature: feature };
				}
				return null;
			}
			// feature in the collection
			else if (this.features_)
			{	this.features_.forEach (function(f) { if (f===feature) found=true; });
				if (found) return { feature: feature };
				else return null;
			}
			// Others
			else return { feature: feature };
		}, this) || {};
}

/** Draw transform sketch
* @param {boolean} draw only the center
*/
ol.interaction.Transform.prototype.drawSketch_ = function(center)
{
	this.overlayLayer_.getSource().clear();
	if (!this.feature_) return;
	if (center===true)
	{	if (!this.ispt_) 
		{	this.overlayLayer_.getSource().addFeature(new ol.Feature( { geometry: new ol.geom.Point(this.center_), handle:'rotate0' }) );
			var ext = this.feature_.getGeometry().getExtent();
			var geom = ol.geom.Polygon.fromExtent(ext);
			var f = this.bbox_ = new ol.Feature(geom);
			this.overlayLayer_.getSource().addFeature (f);
		}
	}
	else
	{	var ext = this.feature_.getGeometry().getExtent();
		if (this.ispt_) 
		{	var p = this.getMap().getPixelFromCoordinate([ext[0], ext[1]]);
			ext = ol.extent.boundingExtent(
				[	this.getMap().getCoordinateFromPixel([p[0]-10, p[1]-10]),
					this.getMap().getCoordinateFromPixel([p[0]+10, p[1]+10])
				]);
		}
		var geom = ol.geom.Polygon.fromExtent(ext);
		var f = this.bbox_ = new ol.Feature(geom);
		var features = [];
		var g = geom.getCoordinates()[0];
		if (!this.ispt_) 
		{	features.push(f);
			// Middle
			if (this.get('stretch') && this.get('scale')) for (var i=0; i<g.length-1; i++)
			{	f = new ol.Feature( { geometry: new ol.geom.Point([(g[i][0]+g[i+1][0])/2,(g[i][1]+g[i+1][1])/2]), handle:'scale', constraint:i%2?"h":"v", option:i });
				features.push(f);
			}
			// Handles
			if (this.get('scale')) for (var i=0; i<g.length-1; i++)
			{	f = new ol.Feature( { geometry: new ol.geom.Point(g[i]), handle:'scale', option:i });
				features.push(f);
			}
			// Center
			if (this.get('translate') && !this.get('translateFeature'))
			{	f = new ol.Feature( { geometry: new ol.geom.Point([(g[0][0]+g[2][0])/2, (g[0][1]+g[2][1])/2]), handle:'translate' });
				features.push(f);
			}
		}
		// Rotate
		if (this.get('rotate')) 
		{	f = new ol.Feature( { geometry: new ol.geom.Point(g[3]), handle:'rotate' });
			features.push(f);
		}
		// Add sketch
		this.overlayLayer_.getSource().addFeatures(features);
	}

};

/** Select a feature to transform
* @param {ol.Feature} the feature to transform
*/
ol.interaction.Transform.prototype.select = function(feature)
{	this.feature_ = feature;
	this.ispt_ = this.feature_ ? (this.feature_.getGeometry().getType() == "Point") : false;
	this.drawSketch_();
	this.dispatchEvent({ type:'select', feature: this.feature_ });
}

/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `true` to start the drag sequence.
 */
ol.interaction.Transform.prototype.handleDownEvent_ = function(evt) 
{
	var sel = this.getFeatureAtPixel_(evt.pixel);
	var feature = sel.feature;
	if (this.feature_ && this.feature_==feature && ((this.ispt_ && this.get('translate')) || this.get('translateFeature')))
	{	sel.handle = 'translate';
	}
	if (sel.handle)
	{	this.mode_ = sel.handle;
		this.opt_ = sel.option;
		this.constraint_ = sel.constraint;
		// Save info
		this.coordinate_ = evt.coordinate;
		this.pixel_ = evt.pixel;
		this.geom_ = this.feature_.getGeometry().clone();
		this.extent_ = (ol.geom.Polygon.fromExtent(this.geom_.getExtent())).getCoordinates()[0];
		this.center_ = ol.extent.getCenter(this.geom_.getExtent());
		this.angle_ = Math.atan2(this.center_[1]-evt.coordinate[1], this.center_[0]-evt.coordinate[0]);

		this.dispatchEvent({ type:this.mode_+'start', feature: this.feature_, pixel: evt.pixel, coordinate: evt.coordinate });
		return true;
	}
	else
	{	this.feature_ = feature;
		this.ispt_ = this.feature_ ? (this.feature_.getGeometry().getType() == "Point") : false;
		this.drawSketch_();
		this.dispatchEvent({ type:'select', feature: this.feature_, pixel: evt.pixel, coordinate: evt.coordinate });
		return false;
	}

};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 */
ol.interaction.Transform.prototype.handleDragEvent_ = function(evt) 
{
	switch (this.mode_)
	{	case 'rotate':
		{	var a = Math.atan2(this.center_[1]-evt.coordinate[1], this.center_[0]-evt.coordinate[0]);
			if (!this.ispt)
			{	var geometry = this.geom_.clone();
				geometry.rotate(a-this.angle_, this.center_);
				
				this.feature_.setGeometry(geometry);
			}
			this.drawSketch_(true);
			this.dispatchEvent({ type:'rotating', feature: this.feature_, angle: a-this.angle_, pixel: evt.pixel, coordinate: evt.coordinate });
			break;
		}
		case 'translate':
		{	var deltaX = evt.coordinate[0] - this.coordinate_[0];
			var deltaY = evt.coordinate[1] - this.coordinate_[1];

			this.feature_.getGeometry().translate(deltaX, deltaY);
			this.handles_.forEach(function(f)
			{	f.getGeometry().translate(deltaX, deltaY);
			});

			this.coordinate_ = evt.coordinate;
			this.dispatchEvent({ type:'translating', feature: this.feature_, delta:[deltaX,deltaY], pixel: evt.pixel, coordinate: evt.coordinate });
			break;
		}
		case 'scale':
		{	var center = this.center_;
			if (evt.originalEvent.metaKey || evt.originalEvent.ctrlKey)
			{	center = this.extent_[(Number(this.opt_)+2)%4];
			}

			var scx = (evt.coordinate[0] - center[0]) / (this.coordinate_[0] - center[0]);
			var scy = (evt.coordinate[1] - center[1]) / (this.coordinate_[1] - center[1]);

			if (this.constraint_)
			{	if (this.constraint_=="h") scx=1;
				else scy=1;
			}
			else
			{	if (evt.originalEvent.shiftKey)
				{	scx = scy = Math.min(scx,scy);
				}
			}

			var geometry = this.geom_.clone();
			geometry.applyTransform(function(g1, g2, dim)
			{	if (dim<2) return g2;
				
				for (i=0; i<g1.length; i+=dim)
				{	if (scx!=1) g2[i] = center[0] + (g1[i]-center[0])*scx;
					if (scy!=1) g2[i+1] = center[1] + (g1[i+1]-center[1])*scy;
				}
				return g2;
			});
			this.feature_.setGeometry(geometry);
			this.drawSketch_();
			this.dispatchEvent({ type:'scaling', feature: this.feature_, scale:[scx,scy], pixel: evt.pixel, coordinate: evt.coordinate });
		}
		default: break;
	}
};

/**
 * @param {ol.MapBrowserEvent} evt Event.
 */
ol.interaction.Transform.prototype.handleMoveEvent_ = function(evt) 
{
	// console.log("handleMoveEvent");
	if (!this.mode_) 
	{	var map = evt.map;
		var sel = this.getFeatureAtPixel_(evt.pixel);
		var element = evt.map.getTargetElement();
		if (sel.feature) 
		{	var c = sel.handle ? this.Cursors[(sel.handle||'default')+(sel.constraint||'')+(sel.option||'')] : this.Cursors.select;
			
			if (this.previousCursor_===undefined) 
			{	this.previousCursor_ = element.style.cursor;
			}
			element.style.cursor = c;
		} 
		else  
		{	if (this.previousCursor_!==undefined) element.style.cursor = this.previousCursor_;
			this.previousCursor_ = undefined;
		}
	}
};


/**
 * @param {ol.MapBrowserEvent} evt Map browser event.
 * @return {boolean} `false` to stop the drag sequence.
 */
ol.interaction.Transform.prototype.handleUpEvent_ = function(evt) 
{	//dispatchEvent 
	this.dispatchEvent({ type:this.mode_+'end', feature: this.feature_, oldgeom: this.geom_ });
	
	this.drawSketch_();
	this.mode_ = null;
	return false;
};

/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
ol.filter = {};
/**
 * @classdesc 
 *   Abstract base class; normally only used for creating subclasses and not instantiated in apps. 
 *   Used to create filters
 *
 * @constructor
 * @extends {ol.Object}
 * @param {Object=} Control options. The style {ol.style.Style} option is usesd to draw the text.
 */
ol.filter.Base = function(options) 
{	ol.Object.call(this);
	if (options && options.active===false) this.set('active', false);
	else this.set('active', true);
}
ol.inherits(ol.filter.Base, ol.Object);

/** Activate / deactivate filter
*	@param {bool}
*/
ol.filter.Base.prototype.setActive = function (b)
{	this.set('active', b===true);
}

/** Get filter active
*	@return {bool}
*/
ol.filter.Base.prototype.getActive = function (b)
{	return this.set('active');
}

/** Add a filter to an ol object
*	@private
*/
ol.filter.Base.prototype.addFilter_ = function(filter)
{	if (!this.filters_) this.filters_ = [];
	this.filters_.push(filter);
	if (filter.precompose) this.on('precompose', function(e)
		{	if (filter.get('active')) filter.precompose(e)
		}, this);
	if (filter.postcompose) this.on('postcompose', function(e)
		{	if (filter.get('active')) filter.postcompose(e)
		}, this);
	filter.on('propertychange', function()
		{	if (this.renderSync) this.renderSync();
			else this.changed(); 
		}, this);
}

/** Add a filter to an ol.Map
*	@param {ol.filter}
*/
ol.Map.prototype.addFilter = function (filter)
{	ol.filter.Base.prototype.addFilter_.call (this, filter);
}
/** Get filters associated with an ol.Map
*	@return {Array<ol.filter>}
*/
ol.Map.prototype.getFilters = function ()
{	return this.filters_;
}

/** Add a filter to an ol.Layer
*	@param {ol.filter}
*/
ol.layer.Base.prototype.addFilter = function (filter)
{	ol.filter.Base.prototype.addFilter_.call (this, filter);
}
/** Get filters associated with an ol.Map
*	@return {Array<ol.filter>}
*/
ol.layer.Base.prototype.getFilters = function ()
{	return this.filters_;
}


/*	Copyright (c) 2016 Jean-Marc VIGLINO, 
	released under the CeCILL-B license (French BSD license)
	(http://www.cecill.info/licences/Licence_CeCILL-B_V1-en.txt).
*/
/** Mask drawing using an ol.Feature
*	@requires ol.filter
*	@extends {ol.filter.Base}
*	@param {ol.filter.cropOptions}
*		- feature {ol.Feature} feature to mask with
*		- fill {ol.style.Fill} style to fill with
*		- inner {bool} mask inner, default false
*/
ol.filter.Mask = function(options)
{	options = options || {};
	ol.filter.Base.call(this, options);
	if (options.feature)
	{	switch (options.feature.getGeometry().getType())
		{	case "Polygon":
			case "MultiPolygon":
				this.feature_ = options.feature;
				break;
			default: break;
		}
	}
	this.set("inner", options.inner);
	this.fillColor_ = options.fill ? ol.color.asString(options.fill.getColor()) || "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.2)";
}
ol.inherits(ol.filter.Mask, ol.filter.Base);

/** Draw the feature into canvas
*/
ol.filter.Mask.prototype.drawFeaturePath_ = function(e, out)
{	var ctx = e.context;
	var canvas = ctx.canvas;
	var ratio = e.frameState.pixelRatio;
	// Transform
	var m = e.frameState.coordinateToPixelTransform;
	function tr(pt)
	{	return [
			(pt[0]*m[0]+pt[1]*m[1]+m[4])*ratio,
			(pt[0]*m[2]+pt[1]*m[3]+m[5])*ratio
		];
	}
	// Old version
	if (!m)
	{	m = e.frameState.coordinateToPixelMatrix;
		tr = function(pt)
		{	return [
				(pt[0]*m[0]+pt[1]*m[1]+m[12])*ratio,
				(pt[0]*m[4]+pt[1]*m[5]+m[13])*ratio
			];
		}
	}
	// Geometry
	var ll = this.feature_.getGeometry().getCoordinates();
	if (this.feature_.getGeometry().getType()=="Polygon") ll = [ll];
	ctx.beginPath();
        if (out)
		{	ctx.moveTo (0,0);
			ctx.lineTo (canvas.width, 0);
			ctx.lineTo (canvas.width, canvas.height);
			ctx.lineTo (0, canvas.height);
			ctx.lineTo (0, 0);
		}
		for (var l=0; l<ll.length; l++)
		{	var c = ll[l];
			for (var i=0; i<c.length; i++) 
			{	var pt = tr(c[i][0]);
				ctx.moveTo (pt[0], pt[1]);
				for (var j=1; j<c[i].length; j++) 
				{	pt = tr(c[i][j]);
					ctx.lineTo (pt[0], pt[1]);
				}
			}
		}
}

ol.filter.Mask.prototype.postcompose = function(e)
{	if (!this.feature_) return;
	var ctx = e.context;
	ctx.save();
		this.drawFeaturePath_(e, !this.get("inner"));
		ctx.fillStyle = this.fillColor_;
		ctx.fill("evenodd");
	ctx.restore();
}
