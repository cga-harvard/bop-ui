/**
 * DatePickerCtrl Controller
 */
angular.module('SolrHeatmapApp')
    .controller('DatePickerCtrl', ['HeatMapSourceGenerator', '$scope', function(HeatMapSourceGeneratorService, $scope) {

        $scope.initialDateOptions = {
            minDate: new Date('2000-01-01'),
            maxDate: new Date('2016-12-31')
        };

        $scope.dateOptions = {
            minDate: HeatMapSourceGeneratorService.getSearchObj().minDate,
            maxDate: HeatMapSourceGeneratorService.getSearchObj().maxDate,
            startingDay: 1, // Monday
            showWeeks: false
        };

        /**
         * Will be called on click on start datepicker.
         * `minDate` will be reset to the initial value (e.g. 2000-01-01),
         * `maxDate` will be adjusted with the `$scope.dte` value to restrict
         *  it not to be below the `minDate`.
         */
        $scope.openStartDate = function() {
            $scope.startDate.opened = true;
            $scope.dateOptions.minDate = $scope.initialDateOptions.minDate;
            $scope.dateOptions.maxDate = $scope.dte;
        };

        /**
         * Will be called on click on end datepicker.
         * `maxDate` will be reset to the initial value (e.g. 2016-12-31),
         * `minDate` will be adjusted with the `$scope.dts` value to restrict
         *  it not to be bigger than the `maxDate`.
         */
        $scope.openEndDate = function() {
            $scope.endDate.opened = true;
            $scope.dateOptions.maxDate = $scope.initialDateOptions.maxDate;
            $scope.dateOptions.minDate = $scope.dts;
        };

        $scope.startDate = {
            opened: false
        };

        $scope.endDate = {
            opened: false
        };

        /**
         * Set initial values for min and max dates in both of datepicker.
         */
        $scope.setInitialDates = function(){
            $scope.dts = $scope.dateOptions.minDate;
            $scope.dte = $scope.dateOptions.maxDate;
        };

        $scope.setInitialDates();

        /**
         * Will be fired after the start date was chosen.
         */
        $scope.onChangeStartDate = function(){
            $scope.setDateRange($scope.dts, $scope.dte);
            HeatMapSourceGeneratorService.performSearch();
        };

        /**
         * Will be fired after the end date was chosen.
         */
        $scope.onChangeEndDate = function(){
            $scope.setDateRange($scope.dts, $scope.dte);
            HeatMapSourceGeneratorService.performSearch();
        };

        /**
         * Help method that updates `searchObj` of the heatmap with
         * the current min and max dates.
         * @param {Date} minDate date value of the start datepicker
         * @param {Date} maxDate date value of the end datepicker
         */
        $scope.setDateRange = function(minDate, maxDate){
          HeatMapSourceGeneratorService.setMinDate(minDate);
          HeatMapSourceGeneratorService.setMaxDate(maxDate);
        };
    }]);
