(function() {

angular
  .module('search_timehistogram_component', [])
  .directive('timeHistogram', timeHistogram);

function timeHistogram() {
  var directive = {
    template: '<div class="bar-graph" id="{{barId}}" style="min-width: 400px";></div>',
    restrict: 'EA',
    link: link
  };
  return directive;

  function link(scope, element, attr) {
    var renderingSvgBars;
    scope.barId = attr.barid;

    scope.$on('setHistogramRangeSlider', function(even, histogram) {
      renderingSvgBars = makeHistogram(histogram);
      renderingSvgBars();
    });

    scope.$on('changeSlider', function(event, slider) {
      renderingSvgBars(slider.minValue, slider.maxValue);
    });

    /**
     * Create histogram
     */
    function makeHistogram(histogram) {

      findHistogramMaxValue();
      return renderingSvgBars;

      function findHistogramMaxValue() {
        histogram.maxValue = Math.max.apply(null, histogram.counts.map(function(obj) {
          return obj.count;
        }));
      }

      function renderingSvgBars(minValue, maxValue) {
        if (histogram.counts) {
          minValue = minValue || 0;
          maxValue = maxValue || histogram.counts.length - 1;

          histogram.bars = document.getElementById(scope.barId);
          var barsheight = 60;
          var rectWidth = (histogram.bars.offsetWidth / histogram.counts.length);
          var svgRect = histogram.counts.map(renderSvgBar);
          histogram.bars.innerHTML = '<svg width="100%" height="' + barsheight + '">' + svgRect.join('') + '</svg>';
        }

        function renderSvgBar(bar, barKey) {
          var height = histogram.maxValue === 0 ? 0 : barsheight * bar.count / histogram.maxValue;
          var y = barsheight - height;
          var translate = (rectWidth) * barKey;
          var color = getColor(barKey, minValue, maxValue);
          return '<g transform="translate(' + translate + ', 0)">' +
                 '  <rect width="' + rectWidth + '" height="' + height + '" y="' + y + '" fill="' + color + '"></rect>' +
                 '</g>';
        }

        function getColor(barKey, minValue, maxValue) {
          return barKey >= minValue && barKey <= maxValue  ? '#2e6da4' : '#E3E3E3';
        }
      }
    }
  }
}

}());
