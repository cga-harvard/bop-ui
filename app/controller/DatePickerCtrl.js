/*eslint angular/di: [2,"array"]*/
/*eslint max-len: [2,100]*/
/**
 * DatePickerCtrl Controller
 */
angular.module('SolrHeatmapApp')
    .controller('DatePickerController', ['HeatMapSourceGenerator', '$uibModal', '$scope',
        function(HeatMapSourceGeneratorService, $uibModal, $scope) {

            var vm = $scope;

            vm.initialDateOptions = {
                minDate: new Date('2000-01-01'),
                maxDate: new Date('2016-12-31')
            };

            vm.dateOptions = {
                minDate: HeatMapSourceGeneratorService.getSearchObj().minDate,
                maxDate: HeatMapSourceGeneratorService.getSearchObj().maxDate,
                startingDay: 1, // Monday
                showWeeks: false
            };

            /**
             * Will be called on click on start datepicker.
             * `minDate` will be reset to the initial value (e.g. 2000-01-01),
             * `maxDate` will be adjusted with the `$scope.dte` value to
             *  restrict it not to be below the `minDate`.
             */
            vm.openStartDate = function() {
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
            vm.openEndDate = function() {
                vm.endDate.opened = true;
                vm.dateOptions.maxDate = vm.initialDateOptions.maxDate;
                vm.dateOptions.minDate = vm.dts;
            };

            vm.startDate = {
                opened: false
            };

            vm.endDate = {
                opened: false
            };

            /**
             * Set initial values for min and max dates in both of datepicker.
             */
            vm.setInitialDates = function(){
                vm.dts = vm.dateOptions.minDate;
                vm.dte = vm.dateOptions.maxDate;
            };

            vm.setInitialDates();

            /**
             * Will be fired after the start date was chosen.
             */
            vm.onChangeStartDate = function(){
                vm.setDateRange(vm.dts, vm.dte);
                HeatMapSourceGeneratorService.performSearch();
            };

            /**
             * Will be fired after the end date was chosen.
             */
            vm.onChangeEndDate = function(){
                vm.setDateRange(vm.dts, vm.dte);
                HeatMapSourceGeneratorService.performSearch();
            };

            /**
             * Help method that updates `searchObj` of the heatmap with
             * the current min and max dates.
             * @param {Date} minDate date value of the start datepicker
             * @param {Date} maxDate date value of the end datepicker
             */
            vm.setDateRange = function(minDate, maxDate){
                HeatMapSourceGeneratorService.setMinDate(minDate);
                HeatMapSourceGeneratorService.setMaxDate(maxDate);
            };

            vm.showInfo = function(){
                var modalInstance = $uibModal.open({
                    animation: true,
                    templateUrl: 'infoPopup.html',
                    controller: 'InfoWindowCtrl',
                    size: 'lg',
                    resolve: {
                        infoMsg: function(){
                            return 'Datem suchen!';
                        },
                        toolName: function(){
                            return 'Choose date!';
                        }
                    }
                });
            };

        }]

);
