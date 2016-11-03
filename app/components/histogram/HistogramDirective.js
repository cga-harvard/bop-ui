/*eslint angular/di: [2,"array"]*/
/*eslint angular/document-service: 0 */
(function() {

    angular
    .module('search_timehistogram_component', [])
    .directive('timeHistogram', ['$rootScope', 'HeatMapSourceGenerator', 'searchFilter', 'DateTimeService',
        function timeHistogram($rootScope, HeatMapSourceGenerator, searchFilter, DateTimeService) {
            var directive = {
                templateUrl: 'components/histogram/histogram.tpl.html',
                restrict: 'EA',
                link: link,
                scope: {}
            };
            return directive;

            function link(scope, element, attr) {
                var renderSvgBars;
                var vm = scope;
                scope.barId = attr.barid;

                scope.slider = defaultSliderValue();

                scope.$on('setHistogramRangeSlider', function(even, histogram) {
                    renderSvgBars = makeHistogram(histogram);
                    renderSvgBars();
                });

                scope.$on('changeSlider', function(event, slider) {
                    renderSvgBars(slider.minValue, slider.maxValue);
                });

                scope.$on('setHistogram', setHistogram);

                scope.$on('slideEnded', slideEnded);

                /**
                 * Create histogram
                 */
                function makeHistogram(histogram) {

                    var barsheight = 40;
                    var histogrambarsWidth = 364;

                    findHistogramMaxValue();
                    return renderingSvgBars;

                    function findHistogramMaxValue() {
                        histogram.maxValue = Math.max.apply(null,
                            histogram.counts.map(function(obj) {
                                return obj.count;
                            })
                        );
                    }

                    function renderingSvgBars(minValue, maxValue) {
                        if (histogram.counts) {
                            minValue = minValue || 0;
                            maxValue = maxValue || histogram.counts.length - 1;
                            histogram.bars = document.getElementById(scope.barId);
                            var rectWidth = (histogrambarsWidth / histogram.counts.length);
                            var svgRect = histogram.counts.map(renderSvgBar);
                            histogram.bars.innerHTML = '<svg width="100%" height="' +
                                barsheight + '">' + svgRect.join('') + '</svg>';
                        }

                        function renderSvgBar(bar, barKey) {
                            var height = histogram.maxValue === 0 ?
                                0 : barsheight * bar.count / histogram.maxValue;
                            var y = barsheight - height;
                            var translate = (rectWidth) * barKey;
                            var color = getColor(barKey, minValue, maxValue);
                            return '<g transform="translate(' + translate + ', 0)">' +
                                 '  <rect width="' + rectWidth + '" height="' + height +
                                 '" y="' + y + '" fill="' + color + '"></rect>' +
                                 '</g>';
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
                    disableSlider(false);

                    if (vm.slider.options.ceil === 1 || isTheInitialDate() ||
                        dataHistogram.counts.length - 1 > vm.slider.options.ceil) {

                        vm.slider.counts = dataHistogram.counts;
                        vm.slider.options.ceil = dataHistogram.counts.length - 1;
                        vm.slider.maxValue = vm.slider.options.ceil;
                        vm.slider.minValue = 0;
                        dataHistogram.slider = vm.slider;
                        $rootScope.$broadcast('setHistogramRangeSlider', dataHistogram);
                    }else{
                        vm.slider.changeTime = false;
                        $rootScope.$broadcast('changeSlider', vm.slider);
                    }
                }

                function isTheInitialDate() {
                    var initialDate = DateTimeService.formatDatesToString(searchFilter.minDate, searchFilter.maxDate);
                    return initialDate === searchFilter.time;
                }

                function slideEnded() {
                    var minKey = vm.slider.minValue;
                    var maxKey = vm.slider.maxValue;

                    vm.datepickerStartDate = new Date(vm.slider.counts[minKey].value);
                    vm.datepickerEndDate = new Date(vm.slider.counts[maxKey].value);
                    vm.dateString = DateTimeService.formatDatesToString(vm.datepickerStartDate,
                                                            vm.datepickerEndDate);
                    performDateSearch();
                }

                function performDateSearch() {
                    vm.slider.changeTime = true;
                    searchFilter.time = vm.dateString;
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
                            noSwitching: true, hideLimitLabels: true,
                            getSelectionBarColor: function() {
                                return '#609dd2';
                            },
                            translate: function() {
                                return '';
                            }
                        }
                    };
                }
            }
        }]);

})();
