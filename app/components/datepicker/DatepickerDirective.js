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
