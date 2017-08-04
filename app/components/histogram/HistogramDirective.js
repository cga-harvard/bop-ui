/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 0 */
(function() {

    angular
    .module('search_timehistogram_component', [])
    .directive('timeHistogram', ['$rootScope', 'DataConf', 'HeatMapSourceGenerator',
        'searchFilter', 'DateTimeService',
        function timeHistogram($rootScope, DataConf, HeatMapSourceGenerator,
            searchFilter, DateTimeService) {
            var directive = {
                templateUrl: 'components/histogram/histogram.tpl.html',
                restrict: 'EA',
                link: link,
                scope: {}
            };
            return directive;

            function link(scope, element, attr) {
                var HistogramBars;
                var vm = scope;

                vm.barId = attr.barid;
                vm.histogramBarsDimensions = {};
                vm.yLegendRange = [];

                vm.slider = defaultSliderValue();

                vm.$on('setHistogramRangeSlider', function(even, histogram) {
                    HistogramBars = makeHistogram(histogram);
                    HistogramBars.renderingSvgBars();
                    vm.histogramBarsDimensions = HistogramBars.dimensions;
                    vm.yLegendRange = createRange(vm.histogramBarsDimensions.maxValue, 2);
                });

                vm.$on('setHistogram', setHistogram);

                vm.$on('slideEnded', slideEnded);

                /**
                 * Create histogram
                 */
                function makeHistogram(histogram) {

                    var barsheight = 54;
                    var histogrambarsWidth = 350;
                    var paddingBar = 8;

                    findHistogramMaxValue();

                    return {
                        renderingSvgBars: renderingSvgBars,
                        dimensions: getDimensions()
                    };

                    function findHistogramMaxValue() {
                        histogram.maxValue = Math.max.apply(null,
                            histogram.counts.map(function(obj) {
                                return obj.count;
                            })
                        );
                    }

                    function getDimensions() {
                        return {
                            barsheight: barsheight,
                            histogrambarsWidth: histogrambarsWidth,
                            paddingBar: paddingBar,
                            counts: histogram.counts,
                            gap: histogram.gap,
                            maxValue: histogram.maxValue
                        };
                    }

                    function renderingSvgBars(minValue, maxValue) {
                        if (histogram.counts) {
                            minValue = minValue || 0;
                            maxValue = maxValue || histogram.counts.length - 1;
                            histogram.bars = document.getElementById(scope.barId);
                            var rectWidth = (histogrambarsWidth - 2*paddingBar) / histogram.counts.length;
                            var svgRect = histogram.counts.map(renderSvgBar);
                            histogram.bars.innerHTML = `<svg style="padding-left:${paddingBar}px" width="100%"
                                height="${barsheight}"> ${svgRect.join('')}</svg>`;
                        }

                        function renderSvgBar(bar, barKey) {
                            var height = 10;
                            if ( histogram.maxValue > 0) {
                                height = (barsheight * bar.count) / histogram.maxValue;
                            }
                            var y = barsheight - height;
                            var translate = (rectWidth) * barKey;
                            var color = getColor(barKey, minValue, maxValue);
                            return `<g transform="translate(${translate}, 0)">
                                        <rect width="${rectWidth}" height="${height}" y="${y}" fill="${color}"></rect>
                                    </g>`;
                        }

                        function getColor(barkey, minvalue, maxvalue) {
                            return barkey >= minvalue && barkey <= maxvalue ? '#88b5dd' : '#E3E3E3';
                        }
                    }
                }

                function setHistogram(event, dataHistogram) {
                    if (!dataHistogram.counts.length) {
                        disableSlider(true);
                        return;
                    }
                    dataHistogram.counts = generateAllDates(dataHistogram.counts);
                    disableSlider(false);

                    // Histogram render new data or more histogram rows data
                    vm.slider.counts = dataHistogram.counts;
                    vm.slider.options.ceil = dataHistogram.counts.length - 1;
                    vm.slider.maxValue = vm.slider.options.ceil;
                    vm.slider.minValue = 0;
                    dataHistogram.slider = vm.slider;

                    $rootScope.$broadcast('setHistogramRangeSlider', dataHistogram);
                }


                function generateAllDates(data) {
                    var newData = [];
                    var unitOfTime = DateTimeService.getDurationFormatFromGap(searchFilter.gap).duration;
                    if (!unitOfTime) {
                        return data;
                    }
                    data.forEach(function (datetime, index) {
                        if (index < data.length - 1) {
                            var startDate = moment(datetime.value).utc();
                            var nextTimeStep = startDate.add(1, unitOfTime);
                            var nextDateInHistogramData = moment(data[index + 1].value).utc();
                            newData.push(datetime);
                            while (nextDateInHistogramData.diff(nextTimeStep) > 0) {
                                newData.push({
                                    count: 0,
                                    value: nextTimeStep.toJSON()
                                });
                                nextTimeStep = nextTimeStep.add(1, unitOfTime);
                            }
                        }
                    });
                    return newData;
                }

                function slideEnded() {
                    DataConf.solrHeatmapApp.isThereInteraction = true;
                    var minKey = vm.slider.minValue;
                    var maxKey = vm.slider.maxValue;

                    if (minKey !== 0) {
                        searchFilter.minDate = new Date(vm.slider.counts[minKey].value);
                    }
                    if (maxKey !== vm.slider.counts.length - 1) {
                        searchFilter.maxDate = new Date(vm.slider.counts[maxKey].value);
                    }
                    vm.datepickerStartDate = searchFilter.minDate;
                    vm.datepickerEndDate = searchFilter.maxDate;
                    vm.dateString = DateTimeService.formatDatesToString(vm.datepickerStartDate,
                                                            vm.datepickerEndDate);
                    performDateSearch();
                }

                function performDateSearch() {
                    vm.slider.changeTime = true;
                    searchFilter.setFilter({time: vm.dateString});
                    HeatMapSourceGenerator.search();
                }

                function disableSlider(option) {
                    if (option) {
                        vm.slider.options.disabled = true;
                        vm.slider.options.getSelectionBarColor = function() {
                            return '#e3e3e3';
                        };
                    }else {
                        vm.slider.options.disabled = false;
                        vm.slider.options.getSelectionBarColor =
                            defaultSliderValue().options.getSelectionBarColor;
                    }

                }

                function defaultSliderValue() {
                    return {
                        minValue: 0,
                        maxValue: 1,
                        changeTime: false,
                        options: {
                            floor: 0,
                            ceil: 1,
                            step: 1,
                            minRange: 1,
                            noSwitching: true,
                            hideLimitLabels: true,
                            getSelectionBarColor: function() {
                                return '#609dd2';
                            },
                            translate: function() {
                                return '';
                            }
                        }
                    };
                }


                function createRange(maxValue, partition) {
                    if (maxValue < partition) {
                        return [];
                    }
                    var range =[];
                    partition = partition || 1;
                    maxValue = maxValue || 0;
                    var step = Math.floor(maxValue/partition);
                    for (var i = 0; i <= maxValue; i = i+step) {
                        range.push(BOP.compactInteger(i));
                    }
                    return range;
                }

                vm.Yaxis = {
                    value: 0,
                    options: {
                        step: 1,
                        floor: 0,
                        ceil: 2,
                        vertical: true,
                        minRange: 1,
                        showTicks: true,
                        translate: function() {
                            return '';
                        },
                        getSelectionBarColor: function() {
                            return '#609dd2';
                        }
                    }
                };

            }
        }]);

})();
