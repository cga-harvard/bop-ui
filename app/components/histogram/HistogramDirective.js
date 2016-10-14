/*eslint angular/document-service: 0 */
(function() {

    angular
    .module('search_timehistogram_component', [])
    .directive('timeHistogram', timeHistogram);

    function timeHistogram() {
        var directive = {
            template: '<div class="bar-graph" ' +
                        'id="{{barId}}" style="min-width: 400px";>' +
                      '</div>',
            restrict: 'EA',
            link: link,
            scope: {}
        };
        return directive;

        function link(scope, element, attr) {
            var renderSvgBars;
            scope.barId = attr.barid;

            scope.$on('setHistogramRangeSlider', function(even, histogram) {
                renderSvgBars = makeHistogram(histogram);
                renderSvgBars();
            });

            scope.$on('changeSlider', function(event, slider) {
                renderSvgBars(slider.minValue, slider.maxValue);
            });

            /**
             * Create histogram
             */
            function makeHistogram(histogram) {

                var barsheight = 40;
                var histogrambarsWidth = 360;

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
        }
    }

})();
