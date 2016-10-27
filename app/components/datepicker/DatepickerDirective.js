/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/
/**
 * DatePickerCtrl Controller
 */
(function() {

    angular
    .module('search_datepicker_component', [])
    .directive('datePicker', ['$rootScope', 'HeatMapSourceGenerator', 'InfoService', 'searchFilter',
        function($rootScope, HeatMapSourceGenerator, InfoService, searchFilter) {
            return {
                link: datePickerFilterLink,
                templateUrl: 'components/datepicker/datepicker.tpl.html',
                restrict: 'EA',
                scope: {}
            };

            function datePickerFilterLink(scope) {

                var vm = scope;

                vm.initialDateOptions = {
                    // minDate: new Date('2016-10-01'),
                    // maxDate: new Date('2016-11-01')
                    minDate: new Date('2013-03-01'),
                    maxDate: new Date('2013-04-01')
                };

                vm.dateOptions = searchFilter;
                vm.dateOptions.startingDate = 1;
                vm.dateOptions.showWeeks= false;

                vm.dateString = getFormattedDateString(vm.dateOptions.minDate,
                                                        vm.dateOptions.maxDate);

                vm.startDate = {
                    opened: false
                };

                vm.endDate = {
                    opened: false
                };

                /**
                 * Set initial values for min and max dates in both of datepicker.
                 */
                vm.datepickerStartDate = vm.dateOptions.minDate;
                vm.datepickerEndDate = vm.dateOptions.maxDate;

                vm.onChangeDatepicker = onChangeDatepicker;

                vm.showDatepickerInfo = showDatepickerInfo;

                vm.openEndDate = openEndDate;

                vm.openStartDate = openStartDate;

                vm.onSubmitDateText = onSubmitDateText;

                vm.slider = defaultSliderValue();

                scope.$on('setHistogram', setHistogram);

                scope.$on('slideEnded', slideEnded);

                /**
                 * Will be called on click on start datepicker.
                 * `minDate` will be reset to the initial value (e.g. 2000-01-01),
                 * `maxDate` will be adjusted with the `scope.datepickerEndDate` value to
                 *  restrict it not to be below the `minDate`.
                 */
                function openStartDate() {
                    vm.startDate.opened = true;
                    vm.dateOptions.minDate = vm.initialDateOptions.minDate;
                    vm.dateOptions.maxDate = vm.datepickerEndDate;
                }


                /**
                 * Will be called on click on end datepicker.
                 * `maxDate` will be reset to the initial value (e.g. 2016-12-31),
                 * `minDate` will be adjusted with the `scope.datepickerStartDate` value to
                 *  restrict it not to be bigger than the `maxDate`.
                 */
                function openEndDate() {
                    vm.endDate.opened = true;
                    vm.dateOptions.maxDate = vm.initialDateOptions.maxDate;
                    vm.dateOptions.minDate = vm.datepickerStartDate;
                }

                /**
                 * Will be fired after the start and the end date was chosen.
                 */
                function onChangeDatepicker(){
                    vm.dateString = getFormattedDateString(vm.datepickerStartDate,
                                                            vm.datepickerEndDate);
                    performDateSearch();
                }

                function getFormattedDateString(minDate, maxDate) {
                    return '[' + minDate.toISOString().replace('.000Z','') + ' TO ' +
                      maxDate.toISOString().replace('.000Z','') + ']';
                }

                function stringToStartEndDateArray(dateString) {
                    var dateArray = dateString.split(' TO ');
                    if (angular.isString(dateString) && dateArray.length === 2) {
                        dateArray[0] = new Date(dateArray[0].slice(1,11));
                        dateArray[1] = new Date(dateArray[1].slice(0,10));
                        if (dateArray[0] === 'Invalid Date' || dateArray[0] === 'Invalid Date') {
                            return null;
                        }
                        return dateArray;
                    }
                    return null;
                }

                function onSubmitDateText() {
                    var dateArray = stringToStartEndDateArray(vm.dateString);
                    if (dateArray !== null) {
                        vm.datepickerStartDate = dateArray[0];
                        vm.datepickerEndDate = dateArray[1];
                        performDateSearch();
                    } else{
                        vm.dateString = getFormattedDateString(vm.datepickerStartDate,
                                                                vm.datepickerEndDate);
                    }
                }

                function showDatepickerInfo() {
                    InfoService.showInfoPopup('datepicker');
                }

                function setHistogram(event, dataHistogram) {
                    if (vm.slider.options.ceil === 1 || vm.slider.changeTime === false) {
                        vm.slider.counts = dataHistogram.counts;
                        vm.slider.options.ceil = dataHistogram.counts.length - 1;
                        vm.slider.maxValue = vm.slider.options.ceil;
                        dataHistogram.slider = vm.slider;
                        $rootScope.$broadcast('setHistogramRangeSlider', dataHistogram);
                    }else{
                        vm.slider.changeTime = false;
                        $rootScope.$broadcast('changeSlider', vm.slider);
                    }
                }

                function slideEnded() {
                    var minKey = vm.slider.minValue;
                    var maxKey = vm.slider.maxValue;
                    vm.datepickerStartDate = new Date(vm.slider.counts[minKey].value);
                    vm.datepickerEndDate = new Date(vm.slider.counts[maxKey].value);
                    vm.dateString = getFormattedDateString(vm.datepickerStartDate,
                                                            vm.datepickerEndDate);
                    performDateSearch();
                }

                function performDateSearch() {
                    searchFilter.time = vm.dateString;
                    vm.slider.changeTime = true;
                    HeatMapSourceGenerator.search();
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
